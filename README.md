# My Portfolio

A full-stack portfolio application with an Express + MongoDB API and a React (Vite) frontend, organized as a monorepo with npm workspaces.

## Structure

```
.
├── frontend/            # React + Vite client
│   ├── public/          # Static assets (favicon, icons)
│   └── src/
│       ├── components/  # layout / navigation
│       ├── pages/       # Home, About, Skills, Projects, Tasks, Contact
│       ├── data/        # static portfolio content
│       ├── services/    # API / auth / task service wrappers
│       ├── App.jsx
│       ├── main.jsx
│       ├── App.css
│       └── index.css
├── server/              # Express + MongoDB API
│   ├── config/          # db connection
│   ├── controllers/     # auth + task handlers
│   ├── middleware/      # logger, error handler, auth guards, activity logger
│   ├── models/          # TaskUser, Task
│   ├── routes/          # auth, tasks
│   ├── logs/            # activity log output
│   └── server.js        # Express entry point
├── package.json         # workspace root / orchestrator scripts
└── .env                 # environment variables (git-ignored)
```

## Getting started

1. Create a `.env` in the repo root with the required variables
   (`MONGODB_URI`, `JWT_SECRET`, `VITE_GOOGLE_CLIENT_ID`, `CLIENT_ORIGIN`).
2. Install dependencies:

   ```sh
   npm install
   ```

3. Run everything (backend + frontend together):

   ```sh
   npm run dev
   ```

Or run each part separately:

```sh
npm run dev:server   # API on http://localhost:5000
npm run dev:client   # Vite on http://localhost:5173
```

## Other scripts

- `npm run build` — production build of the frontend
- `npm run lint` — ESLint across both `frontend` and `server`
- `npm run start:server` — start the API in production mode
- `npm run preview` — preview the built frontend

## API endpoints

- `POST /api/auth/register` — create a local account
- `POST /api/auth/login` — log in
- `POST /api/auth/google` — authenticate with Google ID token
- `POST /api/auth/logout` — log out
- `GET /api/auth/me` — current user (protected)
- `GET /api/tasks` — list tasks (cached with node-cache, 60s TTL)
- `POST /api/tasks` — create a task (invalidates cache)
- `GET /api/tasks/:id` — get single task (cached separately)
- `PUT` / `PATCH` / `DELETE /api/tasks/:id` — update/delete task (invalidates all tasks & task_id cache)
- `GET /api/tasks/cache/stats` — debug endpoint for cache hits, misses, hit ratio, active keys
- `POST /api/tasks/cache/clear` — flush node-cache for cold benchmark testing
- `GET /api/logs` — recent activity log
- `GET /api/logs/csv` — export activity log as CSV

---

## Practical 9: In-Memory Caching & Query Optimization

Implemented server-side in-memory caching using `node-cache` with a default TTL of 60 seconds to significantly decrease database read load and API latency.

### Architecture

```
GET /api/tasks request
       │
       ▼
 Cache check (node-cache)
   ├── HIT  ──► Return cached tasks immediately (0.1ms - 5ms) [Header: X-Cache: HIT]
   └── MISS ──► Query MongoDB / Data Store ──► Store in cache (TTL 60s) ──► Return tasks [Header: X-Cache: MISS]

POST / PUT / DELETE /api/tasks
       │
       ▼
 Write to Database ──► Invalidate cache keys ("all_tasks", "task_:id")
```

### Response Time Comparison (Postman / Thunder Client Benchmarking)

| Sample # | Condition | X-Cache Header | Response Time (Time Field) | Data Source |
| :---: | :---: | :---: | :---: | :---: |
| **Reading 1** | Uncached (Cold DB Read) | `MISS` | **83.43 ms** | MongoDB / Database |
| **Reading 2** | Uncached (Bypass Query) | `MISS` | **79.20 ms** | MongoDB / Database |
| **Reading 3** | Uncached (Bypass Query) | `MISS` | **81.55 ms** | MongoDB / Database |
| **Uncached Avg** | — | — | **~81.39 ms** | — |
| **Reading 1** | Cached (Warm RAM Read) | `HIT` | **4.32 ms** | node-cache (RAM) |
| **Reading 2** | Cached (Warm RAM Read) | `HIT` | **3.80 ms** | node-cache (RAM) |
| **Reading 3** | Cached (Warm RAM Read) | `HIT` | **2.28 ms** | node-cache (RAM) |
| **Cached Avg** | — | — | **~3.46 ms** | — |

> **Performance Gain:** In-memory caching with `node-cache` provided a **~23.5x reduction in latency** and eliminated round-trip database queries for repeated read operations.

### Cache Invalidation Logic
To ensure strict data consistency, the cache is automatically invalidated on any mutating operation:
- **POST `/api/tasks`**: Evicts all tasks collection caches (`all_tasks`, `tasks_*`).
- **PUT / PATCH `/api/tasks/:id`**: Evicts all collection caches and single task key (`task_${id}`).
- **DELETE `/api/tasks/:id`**: Evicts all collection caches and single task key (`task_${id}`).

