# @gladiator1st/n8n-nodes-upstash

![n8n Community Node](https://img.shields.io/badge/n8n-community--node-orange?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@gladiator1st/n8n-nodes-upstash?style=flat-square&color=00e599)](https://www.npmjs.com/package/@gladiator1st/n8n-nodes-upstash)
[![npm weekly downloads](https://img.shields.io/npm/dw/@gladiator1st/n8n-nodes-upstash?style=flat-square&color=blue&logo=npm)](https://www.npmjs.com/package/@gladiator1st/n8n-nodes-upstash)
[![npm total downloads](https://img.shields.io/npm/dt/@gladiator1st/n8n-nodes-upstash?style=flat-square&color=purple&logo=npm)](https://www.npmjs.com/package/@gladiator1st/n8n-nodes-upstash)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)

An all-in-one **n8n Community Node Suite** for **Upstash Serverless Data & AI** — providing native **Vector Search (RAG) for AI Agents**, **Redis Caching & AI Rate-Limiting**, and **QStash Delayed Webhook Scheduling**.

---

## ⚡ Superpowers Included

```
                     ┌─────────────────────────────────────────────────────┐
                     │          @gladiator1st/n8n-nodes-upstash            │
                     └──────────────────────────┬──────────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
       🧠 Upstash Vector Store                                            ⚡ Upstash
    (AI Vector Store Companion)                                    (Consolidated Action Node)
    • LangChain RAG for AI Agents                                  • Resource: Vector (Upsert, Query, Fetch, Delete)
    • Server-Side Auto-Embeddings                                  • Resource: Redis (KV, TTL, JSON, Rate Limiter)
    • SQL-Like Metadata Filters                                    • Resource: QStash (Delayed Webhooks, Cron, Queue)
```

---

## 📦 Nodes in this Package

### 1. 🧠 Upstash Vector Store (`UpstashVectorStore`)
Plugs directly into n8n's **AI Agent**, **Question & Answer Chain**, and **Vector Store Tool** nodes:
- **Server-Side Auto-Embeddings:** Upstash embeds text documents automatically on the server side — no separate embedding model API key needed!
- **External Embeddings Support:** Optionally connect OpenAI, Cohere, or any n8n Embeddings node.
- **Metadata Filters:** Filter queries by category, dates, or custom attributes (e.g. `status = "active"`).

### 2. ⚡ Upstash (`Upstash`)
A consolidated action node exposing all three Upstash serverless products via the `Resource` selector:

- **Resource: Vector**
  - **Create or Update (Upsert):** Auto-embed and insert raw text or float vector arrays with JSON metadata.
  - **Query Similar:** Search nearest vectors or text embeddings with cosine/dot-product similarity.
  - **Fetch by ID:** Batch retrieve stored documents and vectors.
  - **Delete by ID:** Delete vectors by ID.
  - **Get Info & Reset:** Inspect vector count, dimensions, and index metrics or reset namespace.

- **Resource: Redis**
  - **Get Value & Set Value:** Fast Key-Value storage with optional TTL expiration.
  - **Delete Key(s) & Increment Counter:** Delete keys or increment integer counters atomically.
  - **JSON Get & JSON Set:** Read/write structured data using JSONPath (e.g. `$.user.role`).
  - **AI Agent Rate Limiter:** Atomic sliding-window rate limiting to protect AI agent quotas and prevent runaway loops.

- **Resource: QStash**
  - **Publish Message (Delayed/Queue):** Send HTTP requests with human durations (e.g. `10s`, `15m`, `2h`, `7d`).
  - **Reliable Retries:** Automatic exponential backoff retries on destination failure.
  - **Create Cron Schedule:** Schedule recurring cron webhooks (e.g. `0 9 * * 1`).
  - **List & Delete Schedules / Cancel Messages:** Manage active cron schedules and queued messages.

---

## 🚀 Installation

### In n8n (Community Nodes)
1. In your n8n instance, navigate to **Settings** ➔ **Community Nodes**.
2. Click **Install a community node**.
3. Enter:
   ```text
   @gladiator1st/n8n-nodes-upstash
   ```
4. Confirm terms and click **Install**.

---

## ⚙️ Credentials & Setup

Upstash offers a **generous free tier (10,000 req/day for Redis & Vector, 500 messages/day for QStash)** with no credit card required.

1. Sign up at [upstash.com](https://upstash.com).
2. **For Vector:** Create a Vector Index ➔ Copy `UPSTASH_VECTOR_REST_URL` & `UPSTASH_VECTOR_REST_TOKEN`.
3. **For Redis:** Create a Redis Database ➔ Copy `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`.
4. **For QStash:** Go to QStash tab ➔ Copy `QSTASH_TOKEN`.

---

## 📖 End-to-End Usage Examples

### Example 1: AI Customer Support Agent with RAG & Rate Limiting
Build a zero-hallucination customer support chatbot that retrieves company policies from Upstash Vector while enforcing rate limits with Upstash Redis:

```
┌──────────────────────────────┐
│ When Chat Message Received   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Upstash (Resource: Redis)    │ ➔ Rate Limit: 10 requests / 60s per user
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐       ┌────────────────────────────┐
│ AI Agent (Google Gemini/LLM) │ ◄──── │ Vector Store Tool          │
└──────────────┬───────────────┘       └─────────────┬──────────────┘
               │                                     │
               │                                     ▼
               │                       ┌────────────────────────────┐
               │                       │ Upstash Vector Store       │ ➔ Auto-embeds query & retrieves policies
               │                       └────────────────────────────┘
               ▼
┌──────────────────────────────┐
│ Upstash (Resource: QStash)   │ ➔ Schedules delayed CRM follow-up email in 15 minutes
└──────────────────────────────┘
```

#### Step-by-Step Configuration:
1. **Seed Knowledge:** Add an **Upstash** node (`Resource: Vector`, `Operation: Create or Update`) with `Vector ID: policy_refund`, `Input Type: Raw Text`, and `Text Data: All customers are eligible for a 100% refund within 30 days.`. Execute once to index the text.
2. **Rate Limiter:** Add an **Upstash** node (`Resource: Redis`, `Operation: AI Agent Rate Limiter`), set `Rate Limit Identifier: {{ $json.chatInput }}`, `Max Allowed Requests: 10`, `Window Duration: 60`.
3. **AI Agent & Tool:** Add an **AI Agent** node, connect an LLM (e.g. OpenAI / Gemini) and a **Vector Store Tool**. Connect **Upstash Vector Store** to the Vector Store Tool.
4. **Delayed Follow-Up:** Add an **Upstash** node (`Resource: QStash`, `Operation: Publish Message`), set `Destination URL: https://api.crm.com/leads`, and `Delay: 15m`.
5. **Chat:** Ask *"What is your refund policy?"* in the chat box. The AI retrieves the exact 30-day refund policy from Upstash and answers accurately!

---

### Example 2: Full Test Suite Workflow (`examples/upstash_test_workflow.json`)
This package includes a ready-to-run verification workflow covering all three Upstash services.

#### How to import and run:
1. Open n8n and click **Add Workflow** (or press `Ctrl+O`).
2. Click the **`...`** menu in the top right ➔ **Import from File**.
3. Select [`examples/upstash_test_workflow.json`](examples/upstash_test_workflow.json).
4. Assign your Upstash credentials to the nodes.
5. Click **Test workflow** to verify Upsert, Semantic Search, Redis KV Caching, Rate Limiting, and QStash Queuing in one click!

---

## 📄 License
[MIT](LICENSE) © Muhammad Qasim
