import api from "./api";

export async function fetchTasks(page = 1, status = "all") {
  const params = new URLSearchParams({ page });
  if (status && status !== "all") {
    params.append("status", status);
  }
  return api.get(`/tasks?${params.toString()}`);
}

export async function fetchTask(id) {
  return api.get(`/tasks/${id}`);
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
