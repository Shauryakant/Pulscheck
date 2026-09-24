# PulseCheck ⚡

PulseCheck is a high-performance, region-aware distributed uptime monitoring platform engineered to scale. Built as a Node.js monorepo powered by **Turborepo**, PulseCheck decouples website scheduling, execution, and health tracking using a asynchronous message queue model powered by **Redis Streams** and **PostgreSQL**.

---

## 🚀 Why PulseCheck?

Traditional uptime monitoring applications often collapse under load when scaling check frequencies or adding new geographic regions. Synchronous monitoring architectures block HTTP requests, bottleneck databases, and fail silently when workers crash.

**PulseCheck solves this through:**
- **Decoupled Queueing**: Health check requests are pushed to a high-throughput Redis Stream (`betteruptime:website`) without blocking API operations.
- **Region-Aware Workers**: Worker nodes operate across distinct geographical regions, reading from consumer groups and recording region-specific latency metrics.
- **At-Least-Once Delivery & ACK Mechanics**: Tasks are acknowledged (`xAckBulk`) only after successful HTTP check and database persistence. Unacknowledged or orphaned tasks from crashed workers are automatically reclaimed via `xAutoClaimStale`.
- **Single-Service Cloud Deployment**: Built to run all backend workers concurrently (`api`, `pusher`, and `worker`) under a single free Render Web Service tier.

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    subgraph Client & Frontend
        U[User] -->|HTTPS| Web[Next.js 16 Dashboard]
    end

    subgraph API Layer
        Web -->|REST API / Bearer Token| API[Express API Server]
        API -->|Read / Write| DB[(Neon PostgreSQL)]
    end

    subgraph Queue & Processing Engine
        Pusher[Pusher Scheduler Loop] -->|Read Websites| DB
        Pusher -->|xAddBulk / Pipeline Multi| Redis[(Upstash Redis Stream: betteruptime:website)]
        
        Redis -->|xReadGroup / xAutoClaimStale| Worker[Regional Worker Nodes]
        Worker -->|HTTP Ping| Target[Target Website / API]
        Worker -->|Persist WebsiteTicks| DB
        Worker -->|xAckBulk| Redis
    end
```

---

## 📁 Repository Structure

PulseCheck is organized as a Turborepo monorepo:

```
uptime-monitor/
├── apps/
│   ├── api/          # Express.js REST API (Auth, Websites, Status)
│   ├── pusher/       # Scheduler daemon (Queries DB & feeds Redis stream)
│   ├── web/          # Next.js 16 modern dark-mode frontend dashboard
│   └── worker/       # Queue worker daemon (Fetches URLs, checks health, writes ticks)
├── packages/
│   ├── db/           # Prisma client, PostgreSQL schema, and migrations
│   ├── redis-streams/# Shared Redis stream producer/consumer helpers (@repo/redis)
│   ├── eslint-config/# Shared ESLint configurations
│   └── typescript-config/# Shared TypeScript tsconfig templates
├── .env.example      # Master environment variable template
├── package.json      # Root package config & workspace start:all script
└── turbo.json        # Turborepo task pipeline configuration
```

---

## 📊 Database Data Model

```mermaid
erDiagram
    User ||--o{ Website : owns
    Website ||--o{ WebsiteTicks : has
    Region ||--o{ WebsiteTicks : records

    User {
        string id PK
        string username UK
        string password
    }

    Website {
        string id PK
        string url
        string user_id FK
        datetime timeAdded
    }

    Region {
        string id PK
        string name
    }

    WebsiteTicks {
        string id PK
        int response_time_ms
        enum status "Up | Down | Unknown"
        string region_id FK
        string website_id FK
        datetime createdAt
    }
```

---

## 🔑 Environment Variables

Copy `.env.example` to create `.env` in the root or individual app directories:

| Variable | Description | Services Using It | Example / Value |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URL (Neon / Supabase) | `api`, `pusher`, `worker`, `packages/db` | `postgresql://user:pass@ep-xyz.neon.tech/db?sslmode=require` |
| `REDIS_URL` | Redis connection URL (Upstash / Local) | `pusher`, `worker`, `packages/redis-streams` | `rediss://default:pass@united-kiwi.upstash.io:6379` |
| `JWT_SECRET` | Secret key for signing user auth tokens | `api` | `your-secret-key-123` |
| `REGION_ID` | Region identifier (must exist in `Region` DB table) | `worker` | `us-east-1` |
| `WORKER_ID` | Unique worker instance identifier | `worker` | `worker-1` |
| `PORT` | HTTP server port for Express API | `api` | `3000` |
| `NEXT_PUBLIC_API_BASE` | Base URL of deployed Express API | `web` | `http://localhost:3000` |

---

## 🛠️ Local Development

### 1. Requirements
- **Node.js**: `>= 18.0.0`
- **PostgreSQL**: Neon, Supabase, or local instance
- **Redis**: Upstash Redis (`rediss://`) or local Redis server (`>= 6.2` with Streams support)

### 2. Installation
```bash
git clone https://github.com/Shauryakant/Pulscheck.git
cd Pulscheck
npm install
```

### 3. Database Setup & Seeding
```bash
# Set DATABASE_URL in packages/db/.env or terminal
cd packages/db
npx prisma migrate dev
npx tsx seed.ts   # Seeds initial us-east-1 Region record
```

### 4. Running All Services Concurrently
From the repo root:
```bash
# Runs api, web, pusher, and worker simultaneously via Turborepo
npm run dev
```

The services will be live at:
- **Frontend Dashboard**: `http://localhost:3001`
- **Express REST API**: `http://localhost:3000`
- **API Health Check**: `http://localhost:3000/health`

---

## ☁️ Deployment Guide

PulseCheck is optimized for cost-effective deployment: the backend services (`api`, `pusher`, `worker`) run together on **Render**, while the Next.js frontend is deployed on **Vercel**.

### Deploying Backend to Render (Single Web Service)

1. Create a new **Web Service** on Render connected to your repository.
2. Select **Node** environment and configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:all`
   - **Health Check Path**: `/health`
3. Add Environment Variables:
   - `DATABASE_URL` (Neon PostgreSQL URL with `?sslmode=require`)
   - `REDIS_URL` (Upstash Redis `rediss://...`)
   - `JWT_SECRET`
   - `REGION_ID` = `us-east-1`
   - `WORKER_ID` = `worker-1`
   - `PORT` (Provided automatically by Render)

> **Note on Render Free Tier**: Setting the Health Check Path to `/health` ensures Render's health monitor regularly pings `/health` (returning HTTP `200 ok`), keeping the free web service active.

### Deploying Frontend to Vercel

1. Import the repository into **Vercel**.
2. Set the **Root Directory** to `apps/web`.
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_BASE` = `https://your-render-service.onrender.com`

---

## 🌐 API Reference

### Health Check
- `GET /health` -> Returns `200 ok`

### Authentication
- `POST /api/v1/signup` -> Register new user (`{ username, password }`)
- `POST /api/v1/signin` -> Authenticate user (`{ username, password }`) -> Returns `{ userId, token }`

### Website Monitoring (Protected - `Authorization: Bearer <token>`)
- `POST /api/v1/website` -> Add website to monitor (`{ url }`)
- `GET /api/v1/websites` -> Get all monitored websites with latest latency tick & status
- `GET /api/v1/status/:websiteId` -> Get last 10 historical ticks for a specific website

---

## 🛡️ Reliability & Fault Tolerance

1. **Consumer Group Auto-Creation**: `ensureGroup(REGION_ID)` creates stream consumer groups automatically at startup, eliminating manual setup commands.
2. **Stream Trimming**: Every batch push (`xAddBulk`) trims the stream using `MAXLEN ~ 10000` to prevent memory blowup in Redis.
3. **Graceful Retries**: Failed HTTP checks log status as `Down` and write a tick. If database writes fail, the message remains unacknowledged and is retried via `xAutoClaimStale`.

---

## 📄 License

Distributed under the MIT License.
