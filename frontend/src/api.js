// Simple fetch wrapper for the BANGUS BUHAI backend.
// Base URL can be overridden with VITE_API_URL env var.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (err) {
    throw new ApiError(`Network error: could not reach ${BASE_URL}. Is the backend running?`, 0);
  }

  if (res.status === 204) return null;

  let body = null;
  try {
    body = await res.json();
  } catch {
    // no/invalid JSON body
  }

  if (!res.ok) {
    const detail = body?.detail;
    const message = Array.isArray(detail)
      ? detail.map((d) => d.msg || JSON.stringify(d)).join("; ")
      : detail || `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return body;
}

const qs = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : "";
};

export const api = {
  // ---- Tanks ----
  listTanks: (params) => request(`/tanks/${qs(params)}`),
  getTank: (id) => request(`/tanks/${id}`),
  getTankSummary: (id) => request(`/tanks/${id}/summary`),
  createTank: (data) => request(`/tanks/`, { method: "POST", body: JSON.stringify(data) }),
  updateTank: (id, data) => request(`/tanks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTank: (id) => request(`/tanks/${id}`, { method: "DELETE" }),

  // ---- Water logs ----
  listWaterLogs: (tankId, params) => request(`/tanks/${tankId}/logs${qs(params)}`),
  listAllWaterLogs: (params) => request(`/tanks/logs/all${qs(params)}`),
  getWaterLog: (tankId, logId) => request(`/tanks/${tankId}/logs/${logId}`),
  createWaterLog: (tankId, data) =>
    request(`/tanks/${tankId}/logs`, { method: "POST", body: JSON.stringify(data) }),
  updateWaterLog: (tankId, logId, data) =>
    request(`/tanks/${tankId}/logs/${logId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWaterLog: (tankId, logId) =>
    request(`/tanks/${tankId}/logs/${logId}`, { method: "DELETE" }),

  // ---- Feeding logs ----
  listFeedingLogs: (tankId, params) => request(`/tanks/${tankId}/feedings${qs(params)}`),
  createFeedingLog: (tankId, data) =>
    request(`/tanks/${tankId}/feedings`, { method: "POST", body: JSON.stringify(data) }),
  deleteFeedingLog: (tankId, feedingId) =>
    request(`/tanks/${tankId}/feedings/${feedingId}`, { method: "DELETE" }),

  // ---- Predictions ----
  runPrediction: (tankId) =>
    request(`/tanks/${tankId}/predictions/`, { method: "POST" }),
  listPredictions: (tankId) => request(`/tanks/${tankId}/predictions/`),
  getLatestPrediction: (tankId) => request(`/tanks/${tankId}/predictions/latest`),

  // ---- Users ----
  listUsers: (params) => request(`/users/${qs(params)}`),
  createUser: (data) => request(`/users/`, { method: "POST", body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),

  // ---- Health ----
  health: () => request(`/health`),
};

export const REQUIRED_LOGS_FOR_PREDICTION = 48;
