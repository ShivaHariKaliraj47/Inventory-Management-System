import { supabase } from "../Authentication/supabase";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function request(path, options = {}) {
  let token = null;
  if (supabase) {
    const sessionRes = await supabase.auth.getSession().catch(() => ({ data: {} }));
    token = sessionRes?.data?.session?.access_token;
  }
  if (!token) throw new Error("Your session has expired.");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "The inventory backend request failed.");
  }
  return response.json();
}

export async function loadInventory() {
  const data = await request("/api/inventory");
  return data.state;
}

export async function saveInventory(state) {
  return request("/api/inventory", {
    method: "PUT",
    body: JSON.stringify(state),
  });
}
