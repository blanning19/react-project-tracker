// src/api/authFetch.js
import { tokenStore } from '../auth/tokens';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function refreshAccessToken() {
    const refresh = tokenStore.getRefresh();
    if (!refresh) return null;

    const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return null;

    const data = await res.json(); // { access }
    tokenStore.setAccess(data.access);
    return data.access;
}

export async function authFetch(path, options = {}) {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

    const access = tokenStore.getAccess();
    if (access) headers.set('Authorization', `Bearer ${access}`);

    const firstRes = await fetch(url, { ...options, headers });

    // If access token expired, try refresh once, then retry request
    if (firstRes.status === 401) {
        const newAccess = await refreshAccessToken();
        if (!newAccess) {
            tokenStore.clear();
            return firstRes; // caller can redirect to /login
        }

        headers.set('Authorization', `Bearer ${newAccess}`);
        return fetch(url, { ...options, headers });
    }

    return firstRes;
}
