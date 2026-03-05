import { isCookieAuth } from "../auth/mode";
import { tokenStore } from "../auth/tokens";
import type { ApiError, FetchResponse } from "../types/http";

/**
 * Base API URL used for all frontend HTTP requests.
 *
 * Behavior:
 * - uses the configured Vite environment variable when available
 * - falls back to the local Django development server when the environment
 *   variable is not set
 * - always appends `/api/` so request helpers can pass relative endpoint paths
 */
const baseUrl = `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api/`;

/**
 * Creates an AbortController tied to a timeout.
 */
const withTimeout = (ms: number) => {
    const controller = new AbortController();
    const id = window.setTimeout(() => controller.abort(), ms);

    return {
        controller,
        cancel: () => window.clearTimeout(id),
    };
};

/**
 * Parses the HTTP response body into the most useful frontend value.
 */
const parseBody = async (res: Response): Promise<unknown> => {
    const text = await res.text();

    if (!text) {
        return null;
    }

    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        return text;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

/**
 * Attempts to refresh the current access token.
 *
 * Returns:
 * - true when refresh succeeds and a new access token is stored
 * - false when refresh fails or no usable refresh token exists
 */
const refreshAccessToken = async (): Promise<boolean> => {
    if (isCookieAuth) {
        const res = await fetch(new URL("auth/refresh/", baseUrl), {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({}),
        });

        if (!res.ok) {
            return false;
        }

        const data = await res.json();

        if (!data?.access) {
            return false;
        }

        tokenStore.setAccess(data.access);
        return true;
    }

    const refresh = tokenStore.getRefresh();

    if (!refresh) {
        return false;
    }

    const res = await fetch(new URL("auth/refresh/", baseUrl), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
        return false;
    }

    const data = await res.json();

    if (!data?.access) {
        return false;
    }

    tokenStore.setAccess(data.access);

    if (data?.refresh) {
        tokenStore.setRefresh(data.refresh);
    }

    return true;
};

async function request<T = unknown>(
    path: string,
    {
        method = "GET",
        headers = {},
        body,
        timeout = 5000,
    }: {
        method?: string;
        headers?: HeadersInit;
        body?: BodyInit | null;
        timeout?: number;
    } = {}
): Promise<FetchResponse<T>> {
    const { controller, cancel } = withTimeout(timeout);

    /**
     * Executes the actual fetch call using the current access token.
     *
     * This is defined as an inner helper because the request may need to be
     * performed twice:
     * - first attempt
     * - second attempt after a successful token refresh
     */
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
                ...(headers as Record<string, string>),
            },
            body,
        });
    };

    try {
        let res = await doFetch();
        let data = await parseBody(res);

        /**
         * Refresh behavior:
         * - Any 401 on non-auth endpoints triggers a single refresh attempt.
         * - If refresh succeeds, retry the original request once.
         *
         * This avoids brittle coupling to a specific backend error payload shape.
         */
        const isAuthEndpoint = path.startsWith("auth/");
        const shouldAttemptRefresh = res.status === 401 && !isAuthEndpoint;

        if (shouldAttemptRefresh) {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                res = await doFetch();
                data = await parseBody(res);
            }
        }

        if (!res.ok) {
            const err = new Error(`Request failed with status ${res.status}`) as ApiError;
            err.status = res.status;
            err.data = data;
            err.response = {
                status: res.status,
                data,
            };
            throw err;
        }

        return {
            data: data as T,
            status: res.status,
            ok: res.ok,
            headers: Object.fromEntries(res.headers.entries()),
        };
    } catch (err) {
        if ((err as DOMException)?.name === "AbortError") {
            const timeoutErr = new Error(`Request timed out after ${timeout}ms`) as ApiError;
            timeoutErr.code = "ECONNABORTED";
            throw timeoutErr;
        }

        throw err;
    } finally {
        cancel();
    }
}

const FetchInstance = {
    get: <T = unknown>(path: string, options?: { headers?: HeadersInit; timeout?: number }) =>
        request<T>(path, { ...options, method: "GET" }),

    delete: <T = unknown>(path: string, options?: { headers?: HeadersInit; timeout?: number }) =>
        request<T>(path, { ...options, method: "DELETE" }),

    post: <T = unknown>(path: string, data: unknown, options?: { headers?: HeadersInit; timeout?: number }) =>
        request<T>(path, { ...options, method: "POST", body: JSON.stringify(data) }),

    put: <T = unknown>(path: string, data: unknown, options?: { headers?: HeadersInit; timeout?: number }) =>
        request<T>(path, { ...options, method: "PUT", body: JSON.stringify(data) }),

    patch: <T = unknown>(path: string, data: unknown, options?: { headers?: HeadersInit; timeout?: number }) =>
        request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(data) }),
};

export default FetchInstance;