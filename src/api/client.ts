const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("business_nexus_token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const error = new Error(
      errorData?.message || "API request failed",
    ) as Error & {
      data?: unknown;
      status?: number;
    };
    // Kept as extra properties so every existing caller that only reads
    // `.message` keeps working unchanged; new callers (like meetings.ts)
    // can read `.data` / `.status` when they need more than the message.
    error.data = errorData;
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export default API_URL;
