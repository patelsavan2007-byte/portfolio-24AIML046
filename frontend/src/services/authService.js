import api from "./api";

export async function register(payload) {
  return api.post("/auth/register", payload);
}

export async function login(payload) {
  return api.post("/auth/login", payload);
}

export async function loginWithGoogle(idToken) {
  return api.post("/auth/google", { idToken });
}

export async function logout() {
  return api.post("/auth/logout");
}

export async function getCurrentUser() {
  return api.get("/auth/me");
}
