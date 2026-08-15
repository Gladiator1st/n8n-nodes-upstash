# @gladiator1st/n8n-nodes-upstash

![n8n Community Node](https://img.shields.io/badge/n8n-community--node-orange?style=flat-square)
![npm version](https://img.shields.io/npm/v/@gladiator1st/n8n-nodes-upstash?style=flat-square&color=00e599)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)

An all-in-one **n8n Community Node Suite** for **Upstash Serverless Data & AI** — providing native **Vector Search (RAG) for AI Agents**, **Redis Caching & AI Rate-Limiting**, and **QStash Delayed Webhook Scheduling**.

---

## ⚡ Superpowers Included

```
                     ┌─────────────────────────────────────────────────────┐
                     │          @gladiator1st/n8n-nodes-upstash            │
                     └──────────────────────────┬──────────────────────────┘
                                                │
       ┌────────────────────────────────┼────────────────────────────────┐
       ▼                                ▼                                ▼
🧠 Upstash Vector Store          💾 Upstash Redis                 ⏰ Upstash QStash
• LangChain RAG for AI Agents    • Key-Value & JSON Storage       • Delayed Webhook Scheduler
• Server-Side Auto-Embedding     • Sliding-Window Rate Limiter    • Reliable Retries & Cron
• Metadata Filtering             • AI Agent Cost Saver            • Deduplication & Queues
```

---

## 📦 Nodes in this Package

### 1. 🧠 Upstash Vector Store (`UpstashVectorStore`)
Plugs directly into n8n's **AI Agent**, **Question & Answer Chain**, and **Vector Store Retriever** nodes.
- **Server-Side Auto-Embeddings:** Upstash automatically embeds text documents on the server side — no separate embedding model API key needed!
- **External Embeddings Support:** Optionally connect OpenAI, Cohere, or any n8n Embeddings node.
- **SQL-like Metadata Filters:** Filter queries by category, dates, or custom attributes (e.g. `status = "active"`).

### 2. 🔍 Upstash Vector Action (`UpstashVector`)
Direct node for vector operations on the canvas:
- **Upsert:** Insert or update raw text or float vectors with metadata.
- **Query:** Search nearest vectors or text embeddings.
- **Fetch & Delete:** Batch fetch or delete vectors by IDs.
- **Index Info & Reset:** Query vector count, dimensions, and index metrics.

### 3. 💾 Upstash Redis (`UpstashRedis`)
Serverless Redis over stateless HTTPS REST:
- **Key-Value:** Fast `GET`, `SET` (with TTL expiration), `DELETE`, `INCR`.
- **JSON:** Native `JSON.GET` and `JSON.SET` for structured state storage.
- **AI Rate Limiter:** Built-in sliding-window algorithm to prevent expensive AI agent loops and API quota exhaustion.

### 4. ⏰ Upstash QStash (`UpstashQStash`)
Serverless HTTP message scheduler and queues:
- **Delayed Execution:** Schedule webhooks with human durations (e.g. `10s`, `15m`, `2h`, `7d`).
- **Guaranteed Delivery:** Automatic exponential backoff retries on destination failure.
- **Recurring Cron:** Schedule cron jobs targeting n8n webhooks.

---

## 🚀 Installation

### In n8n (Community Nodes)
1. In n8n, navigate to **Settings** ➔ **Community Nodes**.
2. Click **Install a community node**.
3. Enter:
   ```text
   @gladiator1st/n8n-nodes-upstash
   ```
4. Check the terms confirmation and click **Install**.

---

## ⚙️ Credentials & Setup

Upstash offers a **generous free tier (10,000 req/day for Redis & Vector, 500 messages/day for QStash)** with no credit card required.

1. Sign up at [upstash.com](https://upstash.com).
2. **For Vector:** Create a Vector Index ➔ Copy `UPSTASH_VECTOR_REST_URL` & `UPSTASH_VECTOR_REST_TOKEN`.
3. **For Redis:** Create a Redis Database ➔ Copy `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`.
4. **For QStash:** Go to QStash tab ➔ Copy `QSTASH_TOKEN`.

---

## 📄 License
[MIT](LICENSE) © Muhammad Qasim
