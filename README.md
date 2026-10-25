# My Portfolio

[![CI Pipeline](https://github.com/patelsavan2007-byte/portfolio-24AIML046/actions/workflows/ci.yml/badge.svg)](https://github.com/patelsavan2007-byte/portfolio-24AIML046/actions/workflows/ci.yml)

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
- `POST /api/ai/generate-description` — AI-powered task description generator with rate limiter and graceful fallback (Practical 13)

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

---

## Practical 10: Asynchronous Processing with Event-Driven Architecture

Implemented non-blocking background processing using Node.js built-in `EventEmitter` to decouple side-effects (notifications, slow tasks) from the critical API request-response cycle.

### Architecture

```
POST /api/tasks request
       │
       ▼
 Save task to Database / Memory
       │
       ├───────────────────────────────┐
       ▼                               ▼
 [API] Response sent (201)       taskEvents.emit('task-created', task)
 (Responds in ~5-15ms)                 │
                                       ▼
                             Notification Listener (Asynchronous)
                               ├── Logs: Task title, ISO timestamp, assigned user
                               └── Simulated slow handler (setTimeout 2000ms)
                                     └── [Notification] Handler finished at <ISO time>
```

### Event Listeners (`server/listeners.js`)
1. **`task-created`**:
   - Logs: `[Notification] Task "<title>" created at <ISO time>, assigned to <user>`
   - Simulates a slow notification service via `setTimeout` (2-second artificial delay), then logs `[Notification] Handler finished at <ISO time>`.
2. **`task-deleted`**:
   - Logs: `[Notification] Task "<title>" (ID: <id>) deleted at <ISO time>`
3. **`task-error`**:
   - Catches and logs errors thrown inside event handlers: `[Notification] Error in task processing at <ISO time>: <message>`
4. **`error`**:
   - Prevents Node process crashes caused by unhandled EventEmitter error events.

### Proof of Non-Blocking Asynchronous Behavior (Console Log Evidence)

```
[API] Response sent at 2026-10-19T07:16:10.711Z
[Notification] Task "Study Event-Driven Architecture" created at 2026-10-19T07:16:10.715Z, assigned to Unassigned
[Notification] Handler finished at 2026-10-19T07:16:12.721Z
```

Notice:
- The **API response was returned immediately** at `07:16:10.711Z` (~15ms response time in Postman).
- The slow notification handler completed **2.010 seconds later** at `07:16:12.721Z` without adding any latency to the client request.

---

## Practical 11: Containerization with Docker & Docker Compose

Containerized the full-stack Task Management application (React frontend, Node.js/Express backend, and MongoDB database) using Docker and orchestrated multi-container deployment via Docker Compose.

### Architecture

```
                       Host Machine (Browser: http://localhost:5173)
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            │                                                   │
            ▼ (port 5173)                                       ▼ (port 5000)
┌───────────────────────┐                           ┌───────────────────────┐
│       frontend        │                           │        backend        │
│    (React / Nginx)    │                           │    (Node.js / Express)│
└───────────┬───────────┘                           └───────────┬───────────┘
            │                                                   │
            │           Docker Network (app-network)            │
            └───────────────────────────────────────────────────┤
                                                                ▼ (service: mongodb:27017)
                                                    ┌───────────────────────┐
                                                    │        mongodb        │
                                                    │   (Official Image)    │
                                                    └───────────┬───────────┘
                                                                │
                                                                ▼
                                                    Named Volume: mongo-data
                                                    (Persistent Storage)
```

### Services Overview (`docker-compose.yml`)

1. **`frontend` (React + Nginx)**:
   - **Multi-Stage Build**: Stage 1 uses `node:18` to build the static React assets (`npm run build`); Stage 2 uses `nginx:alpine` to serve production assets on port **5173** (reduces image size from ~1.2 GB to ~45 MB).
   - **Port**: `5173:5173`
   - **Depends on**: `backend`
2. **`backend` (Node.js + Express API)**:
   - Built from `./server/Dockerfile` using `node:18`.
   - **Port**: `5000:5000`
   - **Depends on**: `mongodb`
   - **Environment**: Connects to MongoDB via service name `MONGO_URI=mongodb://mongodb:27017/taskdb` across `app-network`.
3. **`mongodb` (Official Database Image)**:
   - **Image**: `mongo:latest`
   - **Port**: `27017:27017`
   - **Volume**: Bound to named volume `mongo-data:/data/db` ensuring data persists across container restarts and rebuilds.
4. **`app-network`**:
   - Custom Docker bridge network allowing inter-container DNS resolution (`mongodb`, `backend`).

---

### How to Run with Docker

#### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine) installed and running.
- Verify installation:
  ```sh
  docker --version
  docker compose version
  ```

#### 2. Start the Entire Stack
From the project root (`MyPortFolio/`), run:
```sh
docker-compose up --build
```
*(Or using Docker CLI v2: `docker compose up --build`)*

This single command automatically:
- Builds the multi-stage React frontend image.
- Builds the Express backend image.
- Pulls the official MongoDB image.
- Creates the bridge network (`task-app-network`) and named volume (`task-mongo-data`).
- Starts all 3 containers with the proper dependency order.

#### 3. Access Application Endpoints
- **Frontend Web UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **MongoDB Database**: `mongodb://localhost:27017`

#### 4. Verify Running Containers
In another terminal, check container statuses:
```sh
docker ps
```
All 3 containers (`task-frontend`, `task-backend`, `task-mongodb`) should show status `Up`.

#### 5. How to Stop the Application
To stop all containers and retain data:
```sh
docker-compose down
```
*(Or press `Ctrl + C` in the running terminal).*

#### 6. How to Verify Data Persistence Across Restarts
1. Open [http://localhost:5173/tasks](http://localhost:5173/tasks) and create a new task (e.g., `"Docker Persistence Test"`).
2. Stop the application stack:
   ```sh
   docker-compose down
   ```
3. Restart the containers:
   ```sh
   docker-compose up
   ```
4. Reload [http://localhost:5173/tasks](http://localhost:5173/tasks).
5. The created task `"Docker Persistence Test"` still appears! This proves the named volume (`mongo-data`) safely preserved the data outside the container lifecycle.

---

## Practical 12: CI/CD Pipeline with GitHub Actions

Automated continuous integration pipeline configured using GitHub Actions to enforce code quality via ESLint and execute integration tests via Jest upon every `push` and `pull_request` targeting the `main` branch.

### Pipeline Architecture

```
git push origin main
       │
       ▼
 GitHub Actions Trigger (on: push, pull_request)
       │
       ▼
  Job 1: lint (ESLint)
  ├── Checkout code
  ├── Setup Node.js (v18)
  ├── npm install
  └── Run ESLint (npm run lint)
       │
       ▼ (passes)
  Job 2: build-and-test (Jest + Supertest) [needs: lint]
  ├── Checkout code
  ├── Setup Node.js (v18)
  ├── npm install
  └── Run automated tests (npm test)
       │
       ▼
  Status reported on GitHub (Pass: Green checkmark / Fail: Red X)
```

### Automated Integration Tests (`server/tests/tasks.test.js`)
- **Test 1**: `GET /tasks` asserts HTTP status `200` and validates task list data structure.
- **Test 2**: `GET /tasks/:id` asserts HTTP status `200` and verifies single task payload.
- **Test 3**: `POST /tasks` asserts HTTP status `201` and checks correct creation of task resource.
- **In-Memory Mock Fallback**: Tests execute cleanly in the CI runner without requiring an external MongoDB instance.

### Workflow Specification (`.github/workflows/ci.yml`)
- Triggers automatically on `push` and `pull_request` for the `main` branch.
- Defines sequential dependency: `build-and-test` executes only after `lint` completes successfully (`needs: lint`).
- Runs in the `server` working directory where backend tests and dependencies are managed.

---

## Practical 13: AI API Integration into a Web Application

Integrated OpenAI (`gpt-4o-mini`) via a secure Express backend proxy route to provide intelligent, 2-to-3 sentence task description suggestions directly in the React Task creation form, featuring graceful degradation, rate limiting, and responsible AI governance.

### Architecture & Security Flow

```
React Frontend (Task Creation Form)
       │
       │ 1. Click "Generate description"
       │    (Sends: { title })
       ▼
Express Backend (/api/ai/generate-description)
       │
       ├── Rate Limiter Check (In-memory Map: Max 1 request/task/minute)
       │    └── Exceeded: Returns 200 with fallback: true, rateLimited: true
       │
       ├── Environment Check (OPENAI_API_KEY stored server-side only in .env)
       │    └── Missing/Placeholder: Returns 200 with fallback: true
       │
       │ 2. Proxy request with 10s timeout guard
       ▼
OpenAI API (gpt-4o-mini)
       │
       ├── Success: Returns generated 2-3 sentence task description
       └── Failure / Timeout / Quota: Caught by try/catch
            └── Returns 200 with { description: "", fallback: true, message: "..." }
       │
       ▼
React UI updates
       ├── Editable suggestion filled in textarea
       ├── "Discard suggestion" option appears
       ├── Visible disclaimer: "AI-generated suggestion. Please review before saving."
       └── Core task creation continues to work normally
```

### Key Engineering Features

1. **Server-Side API Key Storage**:
   - The `OPENAI_API_KEY` is loaded strictly on the Express backend from `.env`.
   - The key is **never** exposed in frontend bundle files or browser network calls.
   - `.env` is excluded in `.gitignore`; `.env.example` provides committed template placeholders.
2. **Graceful Degradation**:
   - If the AI API fails (e.g., invalid key, 401 unauthorized, rate quota, network timeout), the backend catches the error and returns HTTP `200` with `{ description: "", fallback: true, message: "..." }`.
   - The frontend displays a non-blocking, non-scary inline notification. The user can continue creating and saving tasks manually without disruption.
3. **10-Second Request Timeout**:
   - Both the OpenAI client and request options are capped with a 10,000ms timeout to prevent hanging connections from blocking server threads or client UI.
4. **In-Memory Rate Limiting**:
   - Simple rate limit without external packages: Max 1 AI request per task/title per 60 seconds using an in-memory `Map`. Returns remaining seconds before next request is permitted.
5. **User Agency & Responsible AI**:
   - The output is placed in the description field as an **editable suggestion**, allowing the user to refine or discard it (`Discard suggestion`).
   - Displays a prominent disclaimer: *"AI-generated suggestion. Please review before saving."*
   - Avoids sending sensitive personally identifiable information (PII) or credentials to external AI APIs.

### Environment Setup (`.env` vs `.env.example`)

1. Copy `.env.example` to `.env`:
   ```sh
   cp .env.example .env
   ```
2. Open `.env` and add your active OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-proj-your_actual_key_here
   ```
3. Never commit `.env` to GitHub. Always verify using:
   ```sh
   git status
   ```

### Postman Testing Guide

#### 1. Success Path
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/ai/generate-description`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "title": "Build Docker image for Task Manager"
  }
  ```
- **Expected Success Response** (`200 OK`):
  ```json
  {
    "description": "Create a multi-stage Dockerfile to containerize the application efficiently. Build and tag the Docker image locally to ensure all dependencies and runtime configurations work as expected.",
    "fallback": false
  }
  ```

#### 2. Graceful Fallback Path (Invalid or Missing API Key)
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/ai/generate-description`
- **Request Body**:
  ```json
  {
    "title": "Test AI Fallback Feature"
  }
  ```
- **Expected Fallback Response** (`200 OK`):
  ```json
  {
    "description": "",
    "fallback": true,
    "message": "AI suggestion is unavailable right now. You can write the description manually."
  }
  ```

#### 3. Rate Limit Exceeded Path
- Send the same request twice within 60 seconds:
- **Expected Rate Limited Response** (`200 OK`):
  ```json
  {
    "description": "",
    "fallback": true,
    "rateLimited": true,
    "message": "Rate limit: Please wait 58s before requesting another AI description for this task."
  }
  ```

