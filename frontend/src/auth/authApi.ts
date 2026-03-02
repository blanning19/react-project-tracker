import { tokenStore } from "./tokens";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const safeJson = async (res: Response): Promise<Record<string, unknown> | null> => {
    try {
        return await res.json();
    } catch {
        return null;
    }
};

export const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });

    if (!res.ok) {
        const msg = await safeJson(res);
        throw new Error(String(msg?.detail || "Login failed"));
    }

    const data = await res.json();
    tokenStore.setAccess(data.access ?? null);
    tokenStore.setRefresh(data.refresh ?? null);
    return data;
};
