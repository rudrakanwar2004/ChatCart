# 🛒 ChatCart – AI‑Powered E‑Commerce Platform

ChatCart is a **full‑stack e‑commerce web application** built with **React (Vite)** on the frontend and **Node.js + Express** on the backend, enhanced with an **AI shopping assistant (ChatFit)** powered by **Ollama (LLaMA models)**.

The platform supports **electronics and fashion shopping**, user authentication, cart & checkout flows, admin management, persistent user memory, and an intelligent conversational assistant that understands context, remembers users, and helps add products to the cart.

---

## ✨ Key Features

### 👤 User Features

* User registration & login (localStorage‑based auth)
* Personalized shopping experience
* Persistent shopping cart (per user)
* Browse **Electronics** and **Fashion** categories
* Product search & recommendations via **ChatFit AI**
* Add to cart (manual + chatbot)
* Multi‑step checkout process
* Cash on Delivery (COD)
* Order history & tracking
* Account profile page

### 🤖 ChatFit – AI Shopping Assistant

* Context‑aware conversations
* Remembers user preferences
* Detects intent (add to cart, browse, price filters, gifts, etc.)
* Supports natural commands like:

  * "Show electronics"
  * "Add the 2nd one to cart"
  * "Products under ₹2000"
* Uses **Ollama (llama3.2:1b)** locally
* Prevents hallucinations using conversation memory

### 👑 Admin Features

* Admin dashboard
* View & manage users
* View all orders
* Update order status (Processing / Shipped / Delivered)
* Delete users and their orders

### 🧠 Persistent User Memory System

* Stores user behavior in `localStorage`
* Tracks:

  * Cart interactions
  * Favorite categories
  * Recent products
  * Chat history (last 10 messages)
  * Conversation context
* Enables personalized greetings & recommendations

---

## 🧩 Tech Stack

### Frontend

* **React (Vite)**
* **React Router DOM**
* **Lucide Icons**
* **CSS (custom styling)**

### Backend

* **Node.js**
* **Express.js**
* **CORS**
* **node-fetch**

### AI / ML

* **Ollama (Local LLM runtime)**
* **LLaMA 3.2 (1B)** model

### Data Storage

* Browser **localStorage** (users, sessions, orders, memory)

---

## 📁 Project Directory Structure

```text
ChatCart/
│
├── node_modules/
├── public/
│
├── src/
│   ├── assets/
│   │   ├── ChatFit.png
│   │   └── react.svg
│   │
│   ├── components/
│   │   ├── CartSidebar.jsx
│   │   ├── CategorySection.jsx
│   │   ├── ChatBot.jsx
│   │   ├── Checkout.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Header.jsx
│   │   └── ProductCard.jsx
│   │
│   ├── pages/
│   │   ├── Account.jsx
│   │   ├── Admin.jsx
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── Login.jsx
│   │   ├── Orders.jsx
│   │   ├── Register.jsx
│   │   └── Welcome.jsx
│   │
│   ├── UserMemories/
│   │   └── userMemoryService.js
│   │
│   ├── App.css
│   └── App.jsx
│
├── server.js
├── package.json
└── README.md
```

---

## 🚀 Application Flow

### 1️⃣ Welcome Screen

* First‑time visitors see an animated welcome page
* Dismissed state stored in `localStorage`

### 2️⃣ Authentication

* Register / Login pages
* Sessions stored as `chatcart_session`
* Role‑based routing:

  * Admin → `/admin`
  * User → `/home`

### 3️⃣ Shopping Experience

* Browse products from backend APIs
* Products fetched from:

  * Mock data
  * DummyJSON API
  * FakeStore API

### 4️⃣ Cart & Checkout

* Cart persists per user
* Quantity controls & discounts
* Multi‑step checkout:

  1. Shipping details
  2. Payment method
  3. Review order

### 5️⃣ Orders

* Orders saved in `localStorage`
* User & admin can track orders

---

## 🤖 ChatFit AI – How It Works

1. User sends a message
2. Intent detection (rule‑based)
3. Context & memory lookup
4. Direct response OR
5. Ollama LLM prompt with:

   * Conversation history
   * Active filters
   * Available products
6. Safe fallback if Ollama fails

---

## 🧠 User Memory System (Highlights)

Stored under key: `chatfit-user-memories`

Tracks:

* `conversationContext`
* `cartItems`
* `favoriteCategories`
* `recentProducts`
* `chatHistory`


---

## 🛠 Backend API Endpoints

### Product APIs

* `GET /api/electronics`
* `GET /api/fashion`
* `GET /api/products`

### AI Proxy

* `POST /api/ollama/generate`

### Health

* `GET /api/health`

---

## ⚙️ Setup Instructions

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Start Ollama (Required)

```bash
ollama run llama3.2:1b
```

### 3️⃣ Start Backend Server

```bash
node server.js
```

### 4️⃣ Start Frontend

```bash
npm run dev
```

---

## 🔐 Default Admin Credentials

```text
Email: siespracticals@gmail.com
Password: 123456
```

---

## 📌 Future Enhancements

* Payment gateway integration (UPI / Cards)
* Real database (MongoDB / PostgreSQL)
* Order analytics dashboard
* Product search with embeddings
* Voice‑enabled ChatFit assistant

---

## 👨‍💻 Author

**Rudra Kanwar**
MCA Student – SIES College of Management Studies
Project: *ChatCart – AI Shopping Assistant*

---

## ⭐ Final Notes

ChatCart demonstrates how **AI + memory + e‑commerce** can deliver a highly personalized shopping experience using **modern React architecture and local LLMs**.

Feel free to extend, refactor, or deploy it 🚀
