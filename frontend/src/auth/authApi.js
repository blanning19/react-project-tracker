// src/auth/authApi.js
import { tokenStore } from './tokens';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function login(username, password) {
    const res = await fetch(`${API_BASE}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        const msg = await safeJson(res);
        throw new Error(msg?.detail || 'Login failed');
    }

    const data = await res.json(); // { access, refresh }
    tokenStore.setAccess(data.access);
    tokenStore.setRefresh(data.refresh);
    return data;
}

async function safeJson(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}
