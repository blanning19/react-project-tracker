import { tokenStore } from "./tokens";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const refreshAccessToken = async (): Promise<string | null> => {
    const refresh = tokenStore.getRefresh();
    if (!refresh) return null;

    const res = await fetch(`${API_BASE}/api/auth/refresh/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh }) });
    if (!res.ok) return null;

    const data = await res.json();
    tokenStore.setAccess(data.access ?? null);
    return data.access ?? null;
};

export const authFetch = async (path: string, options: RequestInit = {}) => {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", headers.get("Content-Type") || "application/json");

    const access = tokenStore.getAccess();
    if (access) headers.set("Authorization", `Bearer ${access}`);

    const firstRes = await fetch(url, { ...options, headers });
    if (firstRes.status !== 401) return firstRes;

    const newAccess = await refreshAccessToken();
    if (!newAccess) {
        tokenStore.clear();
        return firstRes;
    }

    headers.set("Authorization", `Bearer ${newAccess}`);
    return fetch(url, { ...options, headers });
};
