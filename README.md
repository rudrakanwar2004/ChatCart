# 🛒 ChatCart – AI‑Powered E‑Commerce Platform
---

**ChatCart** is a full‑stack e‑commerce demo that pairs a React (Vite) storefront with a compact Express backend and an **AI shopping assistant (ChatFit)** that runs locally via **Ollama**. The app demonstrates a practical pattern for combining a product catalog, a conversational LLM, and in‑browser persistent memory to deliver contextual, actionable shopping assistance.

This README merges implementation details, developer guidance and architecture notes derived from the project source code and server proxy design.

---

## ✨ Key Features (summary)

### 👤 User Features

* Registration & login (localStorage-based sessions)
* Per-user persistent cart saved as `chatcart_cart_{userId}`
* Browse **Electronics** and **Fashion** categories
* Add to cart (manual + chatbot)
* Multi-step checkout (COD supported) with order history saved in `chatcart_orders`
* Account & order history pages

### 🤖 ChatFit — Ollama-backed Assistant

* Frontend → server proxy → Ollama workflow
* Server prepends a compact **PRODUCT_CATALOG** + session metadata to the model prompt to keep model grounded
* Model responses are expected in a strict JSON schema (see **AI/LLM design** section)
* Frontend parses JSON and performs deterministic actions (add_to_cart, recommend)
* Conversation memory persisted under `chatfit-user-memories`

### 👑 Admin Features

* Admin account auto-created on first run (default credentials included)
* Admin dashboard to view users and orders, update order status, and delete users/orders

---

## 🧩 Tech Stack

* **Frontend:** React (Vite), React Router, Lucide icons, plain CSS
* **Backend:** Node.js + Express, `node-fetch` for external API calls
* **AI:** Ollama local runtime (recommended model: `llama3.2:1b` for dev)
* **Storage:** Browser `localStorage` for sessions, carts, orders and user memory

---

## Project Structure (implementation)

```
ChatCart/
├── node_modules/
├── public/
├── src/
│  ├── assets/ (ChatFit.png, react.svg)
│  ├── components/ (Header, ChatBot.jsx, ProductCard.jsx, CategorySection.jsx, CartSidebar.jsx, Checkout.jsx, Dashboard.jsx)
│  ├── pages/ (HomePage, CartPage, CheckoutPage, Login, Register, Welcome, Account, Orders, Admin)
│  ├── UserMemories/ (userMemoryService.js)
│  ├── App.jsx
│  └── App.css
├── server.js   (Ollama proxy, product endpoints, mock & external API adapters)
├── package.json
└── README.md
```

---

## AI / LLM Design (must‑read for developers)

The ChatFit assistant is intentionally **conservative**: the server builds a compact, rule‑driven prompt and the model is required to return **a single JSON object** when asked to act (add/recommend). This prevents hallucination and enables safe automated actions.

### Required JSON schema (frontend parses this exact shape)

```json
{
  "action": "add_to_cart" | "recommend" | "none",
  "product_ids": [101, 102],
  "quantities": [1, 1],
  "message": "Short human-friendly reply to display to the user"
}
```

### Server-side prompt rules (enforced before sending to model)

1. Only return `add_to_cart` when the user's message explicitly requests adding items or indicates quantities.
2. When selecting products, **use only items present in the PRODUCT_CATALOG** and **exclude items already in CURRENT_CART**.
3. For `recommend`, return up to 4 items ordered by rating/relevance and exclude items already in cart.
4. If the request is ambiguous, return `{"action":"none","product_ids":[],"message":"...clarify..."}`.
5. **Return only the JSON object** — no extra commentary outside the JSON.

The frontend and server defensively validate the model output before executing add actions.

### Recommended Ollama settings for local development

* Model: `llama3.2:1b` (good balance for local dev)
* Temperature: `0.05–0.15` to reduce hallucination
* top_p: `0.9`
* max_tokens: `150–600` (keep responses short and structured)
* Server timeout: raise if model inference is slow (e.g. `60_000`ms)

---

## Backend endpoints (what the server provides)

* `GET  /api/health` — health check (returns `{ status: 'OK' }`)
* `GET  /api/electronics` — electronics list (mock + external APIs when available)
* `GET  /api/fashion` — fashion list
* `GET  /api/products` — combined & shuffled list
* `POST /api/ollama/generate` — Ollama proxy (server forwards a prompt to Ollama and returns response)
* `POST /api/ollama/rebuild-context` — (optional) rebuild cached product catalog used for prompts

Note: the server uses mock data and attempts to fetch from `dummyjson` and `fakestoreapi` as fallbacks.

---

## How to run (development)

1. Install dependencies:

```bash
npm install
```

2. Start Ollama and run a model (on the machine where you have Ollama installed):

```bash
# launch Ollama daemon
ollama serve

# run a model for the service
ollama run llama3.2:1b
```

3. Start backend proxy:

```bash
node server.js
# server listens on http://localhost:4000
```

4. Start frontend:

```bash
npm run dev
# Vite dev server — ensure API proxy or CORS is set to reach http://localhost:4000
```

> If the frontend makes requests to `/api/...`, configure `vite.config.js` devServer proxy to forward those calls to the backend at `http://localhost:4000` or use absolute URLs.

---

## Testing & debugging (practical tips)

### Quick API tests (Thunder Client / curl)

1. Health check:

```
GET http://localhost:4000/api/health
```

2. Direct Ollama sanity test (bypass proxy):

```
POST http://localhost:11434/api/generate
{ "model": "llama3.2", "prompt": "Hello", "options": { "max_tokens": 20 } }
```

3. Proxy call without product context (sanity):

```
POST http://localhost:4000/api/ollama/generate
{ "model": "llama3.2", "prompt": "Hello from proxy", "useProductContext": false }
```

4. Proxy call WITH product context (real scenario):

```
POST http://localhost:4000/api/ollama/generate
{ "useProductContext": true, "prompt": "What electronics do you have?", "extraContext": { "current_cart_ids": [], "last_user_query": "", "last_bot_response": "" } }
```

5. Simulate add-to-cart intent (server will include relevant product catalog):

```
POST http://localhost:4000/api/ollama/generate
{ "useProductContext": true, "prompt": "Add the second product to cart", "extraContext": { "current_cart_ids": [], "last_user_query": "What electronics do you have?", "last_bot_response": "1. iPhone 15 Pro
2. Samsung Galaxy S24" }, "options": { "temperature": 0.05 } }
```

### Common issues & fixes

* **Timeout / aborted upstream call:** increase server timeout or reduce prompt/catalog size.
* **Non-JSON model output:** reduce `temperature`, instruct model to return only JSON (server prompt), or trim catalog.
* **Model adds items incorrectly:** ensure the prompt enforces the rule that `add_to_cart` is allowed only when user intent indicates add.
* **Recommendations include cart items:** server includes `CURRENT_CART` in prompt — verify FRONTEND also filters recommendations before showing.

### Console logging

* `server.js` logs prompt length, session metadata and response excerpts to assist prompt tuning.
* `ChatBot.jsx` logs request payloads and raw responses for debugging model outputs.

---

## Persistence & memory (implementation notes)

**LocalStorage keys used**

* `chatcart_session` — current session
* `chatcart_users` — user store (mock users)
* `chatcart_orders` — persisted orders
* `chatcart_cart_{userId}` — per-user cart
* `chatfit-user-memories` — per-user conversation & preference memory (managed by `userMemoryService.js`)

**UserMemoryService highlights**

* Keeps `conversationContext` to prevent hallucinations (previously mentioned products, currentCategory)
* Tracks `cartItems`, `recentProducts`, `favoriteCategories`, `chatHistory` (last 10 messages)
* Used by `ChatBot.jsx` to personalize greetings and remember cart interactions

---

## Recommended server knobs

* `CATALOG_MAX_CHARS` — trim the product catalog before appending to prompts
* `timeoutMs` — raise to accommodate slower local model runs (e.g. `60_000` ms)
* `options.max_tokens` — keep model output short for structured JSON

---

## Default Admin Credentials (development)

```
Email: siespracticals@gmail.com
Password: 123456
```

---

## Known limitations & future work

* Payment gateways (cards / UPI) are not integrated — COD only
* Product catalog is in-memory / mock-based — move to a DB for production (MongoDB/Postgres)
* Large catalogs will overflow model context — move to embedding-based retrieval for scale
* Add unit/e2e tests for JSON parsing & add/recommend flows
* Improve user/session scalability beyond `localStorage`

---

## Contribution & development notes

* The repository contains intentional console logging to help prompt and proxy tuning during development.
* The Ollama proxy enforces strict rules in prompts. If you change prompt structure, test thoroughly with controlled inputs.

---


---

