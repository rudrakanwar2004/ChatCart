# 🛒 ChatCart – AI-Powered E-Commerce Platform

**ChatCart** is a full-stack e-commerce demo that pairs a React (Vite) storefront with a small Express backend and an **AI shopping assistant (ChatFit)** running locally via **Ollama**.
This repository demonstrates an Ollama proxy pattern where the server prepends a compact, cached **PRODUCT_CATALOG** to each LLM prompt so the model can answer product questions and perform cart actions reliably.

> This README has been updated to reflect the work we did together: an Ollama proxy that prepends a product catalog, a strict JSON schema the LLM must return, better session/context handling, debugging console logs, and example Thunder Client requests for step-by-step testing.

---

## ✨ Key Features (refined)

### 👤 User Features

* Registration & login (localStorage based)
* Per-user persistent cart
* Browse **Electronics** and **Fashion**
* Add to cart (manual + chatbot assisted)
* Checkout (multi-step; COD supported)
* Order history persisted in localStorage

### 🤖 ChatFit – Ollama-backed Assistant

* **Ollama-only for add/recommend actions** — the frontend sends every user message to the server proxy which:

  * prepends a compact PRODUCT_CATALOG,
  * appends session metadata (CURRENT_CART, LAST_USER_QUERY, LAST_BOT_RESPONSE),
  * forwards to Ollama and proxies the response back.
* The assistant MUST return **only a single JSON object** following a strict schema (see below).
* The front-end parses that JSON and:

  * performs `add_to_cart` actions (only when model returns that action),
  * shows `recommend` responses (excluding items already in cart),
  * preserves last user query & last bot response in memory.

### 👑 Admin Features

* Admin account creation on first run (default credentials included)
* View users and orders in the mock admin area

### 🧠 Local persistent memory

* Memory stored under `chatfit-user-memories` in localStorage (conversationContext, cartItems, favoriteCategories, recentProducts, last 10 chat messages, etc.)

---

## 🔧 AI / LLM design details (must-read)

### JSON schema (what the model must return)

Frontend only understands this exact JSON format:

```json
{
  "action": "add_to_cart" | "recommend" | "none",
  "product_ids": [101, 102],
  "quantities": [1, 1],
  "message": "Short human-friendly reply to display to the user"
}
```

**Rules to train the model to follow (enforced in the prompt):**

1. If user's message includes add/cart keywords — model may return `action: "add_to_cart"`; otherwise **must not** return add_to_cart.
2. When adding, pick items only from the `PRODUCT_CATALOG` and **exclude items already in CURRENT_CART**.
3. For `recommend`, choose up to 4 items, order by rating/relevance, and exclude CURRENT_CART items.
4. If ambiguous, return `{"action":"none","product_ids":[],"message":"...clarify..."}`.
5. **Return only the JSON** — no extra text outside the JSON object.

(These rules are implemented by constructing a robust `USER_PROMPT` server-side that includes the product catalog + session metadata + the rule list.)

### Recommended Ollama model & settings (dev)

* **Recommended model (compact & reliable for local dev):**

  * `llama3.2:1b` — good balance of size and responsiveness.
  * Alternative small models: `gemma3:1b` or `moondream` (if you prefer non-Llama).
* **Default request options**:

  * `temperature: 0.05–0.15` (low to avoid hallucinations)
  * `top_p: 0.9`
  * `max_tokens: 150–600` (keep small for structured JSON)
* **Server timeout**: server uses a timeout before aborting upstream call — increase it if you get `The operation was aborted.` (see troubleshooting).

---

## 🧩 Project Structure

```
ChatCart/
├── node_modules/
├── public/
├── src/
│  ├── assets/
│  │   └── ChatFit.png
│  ├── components/
│  │   ├── ChatBot.jsx        <- front-end that calls the proxy and expects model JSON
│  │   └── ...other components
│  ├── pages/
│  └── UserMemories/
│      └── userMemoryService.js
├── server.js                 <- Ollama proxy, product catalog builder, product endpoints
├── package.json
└── README.md
```

---

## 🚀 How to run (dev)

1. Install dependencies:

```bash
npm install
```

2. Start Ollama and run a model (example):

```bash
# start the Ollama daemon (if not already running)
ollama serve

# run a small model (recommended)
ollama run llama3.2:1b
# or
# ollama run gemma3:1b
```

3. Start the backend proxy:

```bash
node server.js
```

4. Start the frontend dev server:

```bash
npm run dev
```

> If using Vite dev server and your frontend calls `/api/...`, set dev server proxy in `vite.config.js` or run frontend with proper CORS setup so `http://localhost:4000` is reachable.

---

## 📡 Backend endpoints (what to test)

* `GET  /api/health` — server health check
* `GET  /api/electronics` — electronics list (fetched from external APIs if possible, falls back to mocks)
* `GET  /api/fashion` — fashion list
* `GET  /api/products` — combined list
* `POST /api/ollama/generate` — **proxy**: prepends compact PRODUCT_CATALOG and proxies to Ollama
* `POST /api/ollama/rebuild-context` — force rebuild cached catalog (dev)

---

## 🧪 Testing with Thunder Client (step-by-step)

Use Thunder Client (VS Code) or curl. Start with small tests and increase complexity.

### 1) Health

```
GET http://localhost:4000/api/health
```

Expect `{"status":"OK","message":"Server is running"}`

---

### 2) Direct test to Ollama (bypass proxy) — verifies Ollama is reachable

```
POST http://localhost:11434/api/generate
Content-Type: application/json

{
  "model": "llama3.2",
  "prompt": "Hello",
  "options": { "max_tokens": 20 }
}
```

If this fails, Ollama is not running or model not loaded.

---

### 3) Proxy without product context (sanity)

```
POST http://localhost:4000/api/ollama/generate
Content-Type: application/json

{
  "model": "llama3.2",
  "prompt": "Hello from proxy",
  "useProductContext": false,
  "options": { "max_tokens": 50 }
}
```

Expect a normal Ollama reply proxied.

---

### 4) Proxy WITH product catalog (real scenario)

```
POST http://localhost:4000/api/ollama/generate
Content-Type: application/json

{
  "model": "llama3.2",
  "useProductContext": true,
  "prompt": "What electronics do you have?",
  "extraContext": {
    "current_cart_ids": [],
    "last_user_query": "",
    "last_bot_response": ""
  },
  "options": { "temperature": 0.1, "max_tokens": 200 }
}
```

Expect a JSON string response (the `response` field will contain the text the Ollama model produced — typically the JSON object you asked for).

---

### 5) Simulate add-to-cart from last exchange

```
POST http://localhost:4000/api/ollama/generate
Content-Type: application/json

{
  "model": "llama3.2",
  "useProductContext": true,
  "prompt": "Add the second product to cart",
  "extraContext": {
    "current_cart_ids": [],
    "last_user_query": "What electronics do you have?",
    "last_bot_response": "1. iPhone 15 Pro\n2. Samsung Galaxy S24"
  },
  "options": { "temperature": 0.05, "max_tokens": 120 }
}
```

Expect the model to return a JSON object with `"action":"add_to_cart"` and `"product_ids":[102]` (or similar).

---

## 🔎 Debugging tips — common errors we addressed

### Error: `500 {"error":"Failed to communicate with Ollama (proxy error).","details":"The operation was aborted."}`

* This is usually a **timeout** or upstream abort. Increase server timeout or reduce prompt size.
* In `server.js` you can raise `timeoutMs` before aborting (e.g., `60_000` or `90_000` ms).

### Problem: model returns non-JSON or extraneous text

* Ensure prompts strictly instruct the model to return **only** a single JSON object.
* Reduce `temperature` (0.05–0.15) to reduce creativity.
* Use shorter catalogs or the server's `CATALOG_MAX_CHARS` trimming to keep prompt within token limits.

### Problem: model adds items when user didn't request

* Make the prompt rule explicit: **only** return `add_to_cart` if user message contains add/cart keywords (server prompt enforces this).
* Log session metadata (we keep console logs in server.js and ChatBot.jsx to inspect session/context).

### Problem: recommended items include items already in cart

* Server includes `CURRENT_CART` in session metadata and the prompt requires the model to exclude cart items. The frontend additionally filters model recommendations defensively.

---

## 🧾 Console logs (left in code for beginners)

* `server.js` includes verbose `console.log(...)` showing:

  * when `/api/ollama/generate` is hit,
  * prompt length and excerpt,
  * attached session metadata,
  * upstream response keys & excerpt.
* `ChatBot.jsx` includes logs showing:

  * request details sent to proxy,
  * raw Ollama response,
  * parsed JSON,
  * add/recommend flow decisions.

These logs are intentionally verbose to make debugging / prompt tweaking easy.

---

## 🔁 Rebuild product catalog (dev)

If you change product data and want the server to refresh the cached PRODUCT_CATALOG:

```
POST http://localhost:4000/api/ollama/rebuild-context
```

---

## ⚙️ Recommended server configuration knobs

* `CATALOG_MAX_CHARS` (server): shrink product catalog in prompts if you hit token limits.
* `timeoutMs` (server): increase if Ollama takes longer on your machine.
* `options.max_tokens` (proxy request): smaller values reduce cost and time, and help keep the model focused on emitting short JSON.

---

## ⚠️ Notes about tokens & prompt size

* The effective token usage is the combined size of the **PRODUCT_CATALOG** + **prompt** + **model output**. Large catalogs can overflow model context and cause errors or truncation.
* If you see `prompt_eval_count` or very long durations in the Ollama response, your prompt is getting heavy — trim the catalog or limit it to top-rated items per category.

---

## 🔐 Default Admin Credentials

```
Email: siespracticals@gmail.com
Password: 123456
```

---

## 🧭 Future Enhancements

* Persist product data in a real DB (MongoDB / PostgreSQL) and build lightweight index for catalog (top-N by rating).
* Replace the naive catalog inclusion with an embedding lookup when scaling (only send top-K relevant items).
* Add unit/e2e tests around the JSON parsing logic and the add/recommend flows.
* Add a small retry/backoff for upstream Ollama calls.
* Add UI feedback for "model failed — try again" states.

---

