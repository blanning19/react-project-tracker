// fetchClient.js

import { isCookieAuth } from "../auth/mode";
import { tokenStore } from "../auth/tokens";

const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/`;

function withTimeout(ms) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return { controller, cancel: () => clearTimeout(id) };
}

async function request(path, { method = "GET", headers = {}, body, timeout = 5000 } = {}) {
    const { controller, cancel } = withTimeout(timeout);

    const doFetch = async () => {
        const access = tokenStore.getAccess();
        const authHeader = access ? { Authorization: `Bearer ${access}` } : {};

        return fetch(new URL(path, baseUrl), {
            method,
            signal: controller.signal,
            credentials: isCookieAuth ? "include" : "same-origin",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...authHeader,
                ...headers,
            },
            body,
        });
    };

    const parseBody = async (res) => {
        const text = await res.text();
        if (!text) return null;

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return text;

        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    };

    const refreshAccessToken = async () => {
        if (isCookieAuth) {
            const res = await fetch(new URL("auth/refresh/", baseUrl), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({}), // refresh token comes from HttpOnly cookie
            });
            if (!res.ok) return false;

            const data = await res.json();
            if (!data?.access) return false;

            tokenStore.setAccess(data.access);
            return true;
        }

        const refresh = tokenStore.getRefresh();
        if (!refresh) return false;

        const res = await fetch(new URL("auth/refresh/", baseUrl), {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return false;

        const data = await res.json();
        if (!data?.access) return false;

        tokenStore.setAccess(data.access);
        if (data?.refresh) tokenStore.setRefresh(data.refresh); // rotation support
        return true;
    };

    try {
        let res = await doFetch();
        let data = await parseBody(res);

        if (res.status === 401 && data?.code === "token_not_valid") {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                res = await doFetch();
                data = await parseBody(res);
            }
        }

        if (!res.ok) {
            const err = new Error(`Request failed with status ${res.status}`);
            err.status = res.status;
            err.data = data;
            throw err;
        }

        return { data, status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers.entries()) };
    } catch (err) {
        if (err.name === "AbortError") {
            const timeoutErr = new Error(`Request timed out after ${timeout}ms`);
            timeoutErr.code = "ECONNABORTED";
            throw timeoutErr;
        }
        throw err;
    } finally {
        cancel();
    }
}

const FetchInstance = {
    get: (path, options) => request(path, { ...options, method: "GET" }),
    delete: (path, options) => request(path, { ...options, method: "DELETE" }),
    post: (path, data, options) => request(path, { ...options, method: "POST", body: JSON.stringify(data) }),
    put: (path, data, options) => request(path, { ...options, method: "PUT", body: JSON.stringify(data) }),
    patch: (path, data, options) => request(path, { ...options, method: "PATCH", body: JSON.stringify(data) }),
};

export default FetchInstance;
