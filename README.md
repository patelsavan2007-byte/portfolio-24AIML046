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
- `GET /api/tasks` — list task (protected, paginated)
- `POST /api/tasks` — create a task
- `GET /api/tasks/:id` / `PUT` / `PATCH` / `DELETE` — task operations (protected, ownership checked)
- `GET /api/logs` — recent activity log
- `GET /api/logs/csv` — export activity log as CSV
