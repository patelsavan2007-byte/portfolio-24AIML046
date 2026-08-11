# Richardson Maturity Model Evaluation — Task Management API

## What is the Richardson Maturity Model?

The Richardson Maturity Model (RMM), proposed by Leonard Richardson, classifies REST APIs into four levels based on how well they follow RESTful principles:

| Level | Name               | Description                                                                 |
|-------|--------------------|-----------------------------------------------------------------------------|
| 0     | Swamp of POX       | Single endpoint (usually POST), entire API through one URL                  |
| 1     | Resources          | Individual resources exposed at distinct URIs (e.g., `/tasks`, `/users`)   |
| 2     | HTTP Verbs         | Uses HTTP methods (GET, POST, PUT, DELETE) to indicate actions on resources |
| 3     | Hypermedia Controls| Includes HATEOAS — links in responses to guide the client                   |

---

## API Endpoints Evaluated

```
GET    /api/tasks        → List all tasks
GET    /api/tasks/:id    → Get a single task
POST   /api/tasks        → Create a new task
PUT    /api/tasks/:id    → Full update a task
PATCH  /api/tasks/:id    → Partial update a task
DELETE /api/tasks/:id    → Delete a task
GET    /                 → Health check
```

---

## Level-by-Level Evaluation

### Level 0 — Swamp of POX
**Does the API have multiple endpoints?**

Yes. The API exposes:
- `GET /api/tasks` for listing
- `POST /api/tasks` for creating
- `GET /api/tasks/:id` for reading
- `PUT /api/tasks/:id` for updating
- `DELETE /api/tasks/:id` for deleting

It does NOT funnel everything through a single URL (e.g., it does not require `POST /api` with an `action` parameter).

**Verdict: Level 0 is satisfied.**

---

### Level 1 — Resources
**Does the API expose distinct URIs for each resource?**

Yes. The API uses a dedicated resource path `/api/tasks` for the collection and `/api/tasks/:id` for individual tasks. Each task is addressed by its unique identifier in the URL.

**Verdict: Level 1 is satisfied.**

---

### Level 2 — HTTP Verbs
**Does the API use HTTP methods correctly to indicate actions?**

Yes. The API properly uses:
- `GET` to **read** resources (safe, idempotent)
- `POST` to **create** new resources (returns 201 Created)
- `PUT` to **fully update** a resource
- `PATCH` to **partially update** a resource
- `DELETE` to **remove** a resource

Additionally:
- Correct HTTP status codes are returned:
  - `200 OK` for successful reads and updates
  - `201 Created` for successful resource creation
  - `400 Bad Request` for validation errors
  - `404 Not Found` for non-existent resources
  - `500 Internal Server Error` for unhandled exceptions

The API also follows RESTful URI design by using plural nouns (`/api/tasks`) for the collection.

**Verdict: Level 2 is satisfied.**

---

### Level 3 — Hypermedia Controls (HATEOAS)
**Do responses include links that tell the client what actions are available next?**

No. The current API responses contain only the data payload. For example:

```json
{
  "task": {
    "id": 1,
    "title": "Write report",
    "status": "pending",
    "priority": "high"
  }
}
```

A Level 3 API would include hypermedia links like:

```json
{
  "task": {
    "id": 1,
    "title": "Write report",
    "status": "pending",
    "_links": {
      "self": { "href": "/api/tasks/1" },
      "update": { "href": "/api/tasks/1", "method": "PUT" },
      "delete": { "href": "/api/tasks/1", "method": "DELETE" }
    }
  }
}
```

**Verdict: Level 3 is NOT satisfied.**

---

## Final Evaluation Summary

| Level | Criteria Met? | Status |
|-------|--------------|--------|
| 0     | Multiple endpoints with distinct URIs  | Satisfied |
| 1     | Resources identified by unique URIs    | Satisfied |
| 2     | HTTP verbs used correctly with proper status codes | Satisfied |
| 3     | Hypermedia controls (HATEOAS)          | Not satisfied |

### **The current API satisfies Richardson Maturity Model Level 2.**

---

## Justification for Level 2

The API meets all criteria for Level 2 because:

1. **Distinct Resource URIs (Level 1)**: Tasks are accessible at `/api/tasks` (collection) and `/api/tasks/:id` (individual resource), clearly identifying resources by their URIs.

2. **HTTP Verbs (Level 2)**: Each operation maps to a specific HTTP method:
   - `GET` → Read (no side effects)
   - `POST` → Create (returns 201)
   - `PUT` → Full update
   - `PATCH` → Partial update
   - `DELETE` → Remove

3. **Correct Status Codes**: The API returns semantically meaningful status codes:
   - `200` for successful GET/PUT/PATCH/DELETE
   - `201` for successful POST (resource creation)
   - `400` for client validation errors
   - `404` for missing resources
   - `500` for server errors

4. **Request Logging Middleware**: Every incoming request is logged with method, URL, and timestamp — an operational concern that complements the REST architecture.

5. **Global Error Handling**: A centralized error handler ensures consistent error response formatting across all endpoints.

The API does not include hypermedia controls (HATEOAS), which would be required for Level 3. Adding `_links` objects to responses with navigation hints and available actions would elevate the API to Level 3.

---

## Improvement Roadmap to Level 3 (Optional)

To reach Level 3, the API could be enhanced by:

1. Adding `_links` to every response resource pointing to related actions
2. Returning available transitions (e.g., a pending task can be updated or deleted)
3. Including a root endpoint that documents all available resources and their URIs
4. Adopting a hypermedia format such as HAL, JSON:API, or JSON-LD

For the scope of this project, Level 2 is fully appropriate and widely accepted as a well-structured REST API.
