import api from "./api";

export async function fetchTasks(page = 1, status = "all", noCache = false) {
  const params = new URLSearchParams({ page });
  if (status && status !== "all") {
    params.append("status", status);
  }
  if (noCache) {
    params.append("noCache", "true");
  }
  return api.get(`/tasks?${params.toString()}`);
}

export async function fetchTask(id, noCache = false) {
  const params = noCache ? "?noCache=true" : "";
  return api.get(`/tasks/${id}${params}`);
}

export async function createTask(payload) {
  return api.post("/tasks", payload);
}

export async function updateTask(id, payload) {
  return api.put(`/tasks/${id}`, payload);
}

export async function patchTask(id, payload) {
  return api.patch(`/tasks/${id}`, payload);
}

export async function deleteTask(id) {
  return api.delete(`/tasks/${id}`);
}

// Practical 9: In-Memory Cache Stats and Management
export async function getCacheStats() {
  return api.get("/tasks/cache/stats");
}

export async function clearCache() {
  return api.post("/tasks/cache/clear");
}

