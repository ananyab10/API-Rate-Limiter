\# API Rate Limiter



A production-style rate limiting system built with Node.js, Express, and Redis. Protects API endpoints from abuse using middleware-based request throttling, with a live dashboard to monitor traffic in real time.



\---



\## What It Does



Every incoming request passes through a middleware layer that checks a Redis counter for the caller's IP. If they've exceeded the configured limit within the time window, the request is rejected with a `429 Too Many Requests` response. A live dashboard lets you watch this happen in real time.



\---



\## Architecture



```



Incoming Request
      │
      ▼
┌─────────────────┐
│  Rate Limiter   │  ← middleware in index.js checks Redis counter for IP
│  Middleware     │
└─────────────────┘
        │
   Under limit?
   ┌────┴────┐
  Yes        No
   │          │
   ▼          ▼
Route      429 Error
Handler    returned
   │
   ▼
Redis counter
incremented


\---

```

\## Project Structure


```

API-RATE-LIMITER/

├── node\_modules/       # Dependencies

├── .env                # Environment config (limit, window, Redis URL)

├── dashboard.html      # Live abuse monitoring dashboard

├── index.js            # Express server + routes + rate limiter middleware

├── package.json

└── package-lock.json

```



\---



\## Getting Started



\### Prerequisites



\- Node.js 18+

\- Redis installed and running locally



\### Install Redis



```bash

\# macOS

brew install redis \&\& brew services start redis



\# Ubuntu/Debian

sudo apt install redis-server \&\& sudo systemctl start redis



\# Verify it's running

redis-cli ping   # should return PONG

```



\### Install Dependencies



```bash

npm install

```



\### Configure Environment



Create a `.env` file in the root (already included in the project):



```env

RATE\_LIMIT\_MAX=10        # Max requests allowed per window

RATE\_LIMIT\_WINDOW=60     # Window size in seconds

REDIS\_URL=redis://localhost:6379

PORT=3000

```



\### Run the Server



```bash

node index.js

\# Server running at http://localhost:3000

```



\---



\## Usage



\### Test a Normal Request



```bash

curl http://localhost:3000/api/data

```



\### Trigger the Rate Limit



```bash

\# Fire 15 rapid requests — the 11th should return 429

for i in {1..15}; do curl -s -o /dev/null -w "%{http\_code}\\n" http://localhost:3000/api/data; done

```



\### Open the Dashboard



Navigate to `http://localhost:3000/dashboard` in your browser to see live stats — blocked IPs, request counts, and active counters updating every 2 seconds.



\---



\## API Reference



| Endpoint | Description |

|---|---|

| `GET /api/data` | Protected route — returns dummy JSON |

| `GET /status` | Health check |

| `GET /admin/stats` | Live rate limit stats (blocked IPs, request counts) |

| `GET /dashboard` | Serves dashboard.html |



\### Rate Limit Response Headers



Every response includes:



```

X-RateLimit-Limit: 10

X-RateLimit-Remaining: 7

X-RateLimit-Reset: 1716300060

```



\### 429 Response



```json

{

&#x20; "error": "Too Many Requests",

&#x20; "message": "Rate limit exceeded. Try again in 43 seconds.",

&#x20; "retryAfter": 43

}

```



\---



\## How the Rate Limiter Works



The middleware in `index.js` runs before every request handler:



1\. Extract the caller's IP from the incoming request

2\. Look up their counter in Redis using key `ratelimit:{ip}`

3\. If counter exceeds `RATE\_LIMIT\_MAX` → return `429` immediately

4\. Otherwise, increment the counter (`INCR`) and set expiry on first request only (`EXPIRE`)

5\. Attach `X-RateLimit-\*` headers and pass the request through



Redis `INCR` is atomic, so simultaneous requests from the same IP are handled safely without race conditions.



\---



\## Architecture Decision: Fixed Window vs. Sliding Window



This project uses a \*\*fixed window\*\* counter. Each IP gets a fresh counter every `RATE\_LIMIT\_WINDOW` seconds, reset on a fixed schedule.



\*\*Trade-off:\*\* A caller could make 10 requests at 11:59:59 and 10 more at 12:00:01 — 20 requests in 2 seconds — and both windows would allow it. A sliding window prevents this by tracking the timestamp of every individual request, at the cost of more Redis storage and complexity.



Fixed window was chosen here because it's simpler to implement, easy to reason about, and sufficient for most abuse prevention scenarios. For stricter enforcement (e.g., financial or auth APIs), a sliding window or token bucket would be more appropriate.



\---



\## Tech Stack



| Layer | Technology |

|---|---|

| Server | Node.js + Express |

| Rate limit store | Redis (in-memory, atomic counters) |

| Dashboard | Plain HTML + `fetch()` polling |

| Config | `.env` via dotenv |



\---



\## Why This Project Matters



Rate limiting is a requirement for any public-facing API. The patterns here appear throughout the industry:



\- \*\*Redis\*\* is used by Twitter, GitHub, and Stack Overflow for fast, ephemeral counters

\- \*\*Middleware\*\* is the foundation of every serious backend framework

\- \*\*429 handling and rate limit headers\*\* are part of the HTTP standard and expected by API consumers





