# 🛒 ChatCart — AI‑Powered E‑Commerce Platform

**ChatCart** is a full‑stack, demo e‑commerce application that combines a React (Vite) storefront with a small Express backend and an Ollama‑backed AI shopping assistant named **ChatFit**. The project is designed to be easy to run locally, simple to understand for beginners, and extensible for production use.

---

## Quick highlights

* Frontend: React (Vite), componentized UI, role‑based routing (user vs admin).
* Backend: Node.js + Express serving product endpoints and an Ollama proxy.
* AI: ChatFit sends user messages to a server proxy which prepends a compact product catalog and session metadata, then forwards to a locally running Ollama model. The model returns a strict JSON object the frontend understands.
* Persistence: Browser `localStorage` for sessions, carts, orders, and user memory.

---

## Table of contents

1. Features
2. Architecture & design decisions (important)
3. AI / LLM protocol (must read before experimenting)
4. Project layout
5. Run locally — quick start
6. API endpoints & testing examples
7. Debugging & tuning tips
8. Development notes & logs
9. Future work
10. Author

---

## 1. Features

### User features

* Registration & login (localStorage‑based session)
* Per‑user persistent cart (saved to `localStorage` per user id)
* Browse Electronics & Fashion categories
* Add to cart via UI or ChatFit assistant
* Multi‑step checkout (COD supported) and order history
* Account page and order tracking

### Admin features

* Automatic admin account seeded on first run
* Admin dashboard for viewing users and orders
* Update order status and delete users (with their orders)

### ChatFit (AI assistant)

* Context‑aware product recommendations and add‑to‑cart actions
* Conversation memory (last messages, previously mentioned products)
* Defensive behavior: model is constrained to avoid hallucinations

---

## 2. Architecture & design decisions

### Ollama proxy pattern (why and how)

The frontend sends chat messages to the backend proxy (instead of calling Ollama directly). The proxy:

1. Builds a compact `PRODUCT_CATALOG` (top products, cached or rebuilt on demand).
2. Appends session metadata (`CURRENT_CART`, `LAST_USER_QUERY`, `LAST_BOT_RESPONSE`).
3. Prepends the above to the user prompt and enforces explicit rules.
4. Forwards the request to Ollama and returns the model output to the frontend.

This pattern keeps the prompt‑engineering logic server‑side (safer and easier to debug) and ensures the model only suggests or adds products that actually exist in your catalog.

### Why strict JSON

The frontend expects a single JSON object (see schema below). Enforcing a strict output format simplifies parsing, prevents accidental UI actions, and reduces the chance of hallucinations.

### Persistent local memory

All user state (sessions, cart, orders, chat memory, conversation context) is stored in `localStorage`. The `UserMemoryService` centralizes reads/writes under the key `chatfit-user-memories` and exposes utilities for:

* updating cart items (including `addedViaChatbot` flag),
* recording product interactions, and
* maintaining a trimmed chat history (last 10 messages).

This is ideal for a demo and for beginners; replaceable with a proper backend DB for production.

---

## 3. AI / LLM protocol — **Read this before experimenting with the model**

### Required JSON schema the model must emit

```json
{
  "action": "add_to_cart" | "recommend" | "none",
  "product_ids": [101, 102],
  "quantities": [1, 1],
  "message": "Human-friendly reply to display to the user"
}
```

### Prompt rules enforced server‑side (summary)

1. Only return `add_to_cart` when the user explicitly asked to add (keywords like "add", "put in cart", "add the second one").
2. When returning `add_to_cart`, select items exclusively from the `PRODUCT_CATALOG` and exclude items already in `CURRENT_CART`.
3. `recommend` should return up to 4 items ordered by rating/relevance; exclude items already in cart.
4. If the user query is ambiguous, return `{"action":"none",...}` and ask for clarification.
5. The model must return only the JSON object — no extra explanatory prose outside the JSON.

> The server builds a robust `USER_PROMPT` that includes these rules plus the compact product catalog and session metadata.

### Recommended model & settings (development)

* Model: `llama3.2:1b` (recommended), or another small local model if preferred (e.g., `gemma3:1b`).
* Temperature: `0.05–0.15` (low — reduces hallucination)
* `top_p`: `0.9`
* `max_tokens`: `150–600` (keep small; model must return terse JSON)
* Server timeout: increase if your local machine runs slowly (e.g., 60s).

---

## 4. Project Architecture

```
ChatCart/
├─ node_modules/
├─ public/
├─ src/
│  ├─ assets/ChatFit.png
│  ├─ components/
│  │   ├─ ChatBot.jsx        # frontend chat widget — sends messages to proxy
│  │   ├─ ProductCard.jsx
│  │   ├─ CategorySection.jsx
│  │   ├─ CartSidebar.jsx
│  │   ├─ Dashboard.jsx
│  │   ├─ Header.jsx
│  │   └─ Checkout.jsx
│  ├─ pages/
│  │   ├─ HomePage.jsx
│  │   ├─ CartPage.jsx
│  │   ├─ CheckoutPage.jsx
│  │   ├─ Login.jsx
│  │   ├─ Register.jsx
│  │   ├─ Account.jsx
│  │   ├─ Orders.jsx
│  │   ├─ Admin.jsx
│  │   └─ Welcome.jsx
│  └─ UserMemories/userMemoryService.js
├─ server.js                 # Ollama proxy + product endpoints
├─ package.json
└─ README.md
```

---

## 5. Run locally — Quick start (development)

> This guide assumes you have Node.js, npm, and Ollama installed on your machine.

1. Install dependencies

```bash
npm install
```

2. Start Ollama and run a model

```bash
# start Ollama daemon (if not already running)
ollama serve

# run a small recommended model (in another terminal)
ollama run llama3.2:1b
```

3. Start the backend proxy (port `4000` by default)

```bash
node server.js
```

4. Start the frontend dev server (Vite)

```bash
npm run dev
```

5. Open the app in your browser at `http://localhost:5173` (Vite default) or the URL shown by the dev server.

> If your frontend uses `/api` calls, either configure Vite proxy in `vite.config.js` or call the backend via `http://localhost:4000` directly. CORS is enabled in `server.js` by default.

---

## 6. API endpoints & testing examples

### Endpoints

* `GET  /api/health` — server health
* `GET  /api/electronics` — electronics products (mock + external fetch)
* `GET  /api/fashion` — fashion products (mock + external fetch)
* `GET  /api/products` — combined and shuffled list
* `POST /api/ollama/generate` — proxy to Ollama (prepends product context & rules)
* `POST /api/ollama/rebuild-context` — (dev) rebuild cached product catalog

### Quick tests (Thunder Client / curl)

**Health**

```
GET http://localhost:4000/api/health
```

**Proxy sanity test (no product context)**

```
POST http://localhost:4000/api/ollama/generate
Content-Type: application/json

{ "model":"llama3.2:1b", "prompt":"Hello from proxy", "useProductContext": false }
```

**Proxy with product context (real scenario)** — expect model‑formatted JSON

```
POST http://localhost:4000/api/ollama/generate
Content-Type: application/json

{
  "model": "llama3.2:1b",
  "useProductContext": true,
  "prompt": "What electronics do you have?",
  "extraContext": { "current_cart_ids": [], "last_user_query": "", "last_bot_response": "" },
  "options": { "temperature": 0.1, "max_tokens": 200 }
}
```

**Simulate add-to-cart flow** — provide last bot response that listed items

```
POST http://localhost:4000/api/ollama/generate
Content-Type: application/json

{
  "model": "llama3.2:1b",
  "useProductContext": true,
  "prompt": "Add the second product to cart",
  "extraContext": { "current_cart_ids": [], "last_user_query": "What electronics do you have?", "last_bot_response": "1. iPhone 15 Pro\n2. Samsung Galaxy S24" },
  "options": { "temperature": 0.05, "max_tokens": 120 }
}
```

---

## 7. Debugging & tuning tips (practical)

### Common issues

**Timeout / upstream abort**

* Symptom: `500 ... The operation was aborted.`
* Fix: Increase the server timeout (in `server.js`) and/or reduce prompt size (shrink the product catalog). Consider increasing `timeoutMs` to `60_000` or `90_000`.

**Model returns extraneous text or non‑JSON**

* Symptom: Response contains extra commentary or fails JSON parse.
* Fix: Lower the model temperature (`0.05–0.15`), shorten the catalog, and ensure the server prompt explicitly instructs the model to return only JSON. Add defensive parsing on the frontend.

**Model attempts to add items not in catalog**

* Fix: Server injects `PRODUCT_CATALOG` and enforces a rule requiring the model to pick only from that list. Frontend also filters responses defensively.

**Recommendations include cart items**

* Fix: Server includes `CURRENT_CART` in the prompt and requires the model to exclude them. Frontend filters results again.

---

## 8. Development notes & logs

* `server.js` prints helpful logs when proxying requests (prompt size, session metadata excerpt, upstream response keys) to aid prompt engineering.
* `ChatBot.jsx` logs outgoing proxy requests, raw responses, and parsing/decision results to the console for step‑by‑step debugging.

These verbose logs are intentional for beginners and evaluators — remove or reduce them before production.

---

## 9. Future work & recommended improvements

* Persist product data in a database (MongoDB, PostgreSQL) and build a lightweight index for the catalog.
* Use embeddings and top‑K retrieval instead of sending large catalogs in prompts.
* Add payment gateway integrations (UPI / cards) and proper order persistence on the server.
* Add retry/backoff for upstream Ollama calls and improve error reporting in the UI.
* Add unit/e2e tests around JSON parsing and add/recommend flows.

---


