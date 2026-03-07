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
 * Global session-expired handler.
 *
 * When a 401 occurs and token refresh fails, the user's session is dead.
 * Rather than leaving them on a broken page showing a generic error, we
 * redirect them to /login automatically.
 *
 * Why a callback instead of importing navigate directly:
 * - React Router's useNavigate() only works inside React components/hooks.
 * - fetchClient is a plain module, not a hook, so it cannot call useNavigate().
 * - Registering a callback at app startup (see main.tsx wiring below) lets the
 *   module trigger navigation without being coupled to React internals.
 *
 * Wiring (add to main.tsx or App.tsx — see instructions at bottom of this file):
 *
 *   import { registerSessionExpiredHandler } from "./shared/http/fetchClient";
 *   registerSessionExpiredHandler(() => {
 *       window.location.replace("/login");
 *   });
 */
let onSessionExpired: (() => void) | null = null;

export function registerSessionExpiredHandler(handler: () => void): void {
    onSessionExpired = handler;
}

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
     * Defined as an inner helper because the request may need to be
     * retried once after a successful token refresh.
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
         * - If refresh succeeds, the original request is retried once.
         * - If refresh fails, all local token state is cleared and the global
         *   session-expired handler fires to redirect the user to /login.
         *
         * This prevents users from being stuck on a broken page after their
         * session expires — they are redirected to login automatically.
         */
        const isAuthEndpoint = path.startsWith("auth/");
        const shouldAttemptRefresh = res.status === 401 && !isAuthEndpoint;

        if (shouldAttemptRefresh) {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                // Refresh succeeded — retry the original request with the new token.
                res = await doFetch();
                data = await parseBody(res);
            } else {
                // FIX: Refresh failed — session is unrecoverable.
                // Clear all local auth state and redirect to /login so the user
                // is not left on a broken page with a confusing error message.
                tokenStore.clear();
                onSessionExpired?.();

                // Throw immediately so the calling code does not attempt to
                // process a response from a dead session.
                const sessionErr = new Error("Session expired. Please log in again.") as ApiError;
                sessionErr.status = 401;
                sessionErr.code = "SESSION_EXPIRED";
                throw sessionErr;
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

/**
 * ---------------------------------------------------------------------------
 * WIRING INSTRUCTIONS — add this to frontend/src/main.tsx
 * ---------------------------------------------------------------------------
 *
 * Import and register the session-expired handler once at app startup so that
 * any expired session anywhere in the app redirects cleanly to /login.
 *
 * import { registerSessionExpiredHandler } from "./shared/http/fetchClient";
 *
 * registerSessionExpiredHandler(() => {
 *     // window.location.replace does a hard redirect and clears browser history
 *     // so the user cannot press Back and return to the broken page.
 *     window.location.replace("/login");
 * });
 *
 * Place this call BEFORE ReactDOM.createRoot(...).render(...) so the handler
 * is registered before any API calls can be made.
 * ---------------------------------------------------------------------------
 */
