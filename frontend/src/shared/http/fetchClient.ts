/**
 * @file HTTP client with automatic JWT refresh and session expiry handling.
 *
 * Wraps the native `fetch` API with:
 * - Automatic `Authorization: Bearer` header injection from `tokenStore`
 * - Transparent access-token refresh on `401` responses (one retry)
 * - Request timeout via `AbortController`
 * - A typed response envelope ({@link FetchResponse})
 * - A session-expiry callback hook so the auth layer can redirect without
 *   the HTTP module importing React hooks or router APIs directly
 *
 * All app code that makes HTTP requests should import {@link FetchInstance}
 * from this module rather than calling `fetch` directly.
 *
 * @module http/fetchClient
 */

import { isCookieAuth } from "../auth/mode";
import { tokenStore } from "../auth/tokens";
import type { ApiError, FetchResponse } from "../types/http";

const baseUrl = `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api/`;

/** Registered callback invoked when the token refresh flow fails completely. */
let onSessionExpired: (() => void) | null = null;

/**
 * Registers a callback that is invoked when the user's session has expired
 * and cannot be silently renewed.
 *
 * Call this once from `AuthProvider` on mount so the HTTP layer can trigger
 * a React-side logout and redirect to `/login` without coupling this module
 * to React hooks or the router.
 *
 * The callback is called after `tokenStore.clear()` has already run, so the
 * handler only needs to update React state (e.g. clear `accessToken`) and
 * navigate — it does not need to clear tokens itself.
 *
 * @param handler - Zero-argument function to invoke on session expiry,
 *                  or `null` to deregister the current handler.
 *
 * @example
 * ```ts
 * // Inside AuthProvider useEffect:
 * setSessionExpiredHandler(handleSessionExpired);
 * return () => setSessionExpiredHandler(null);
 * ```
 */
export function setSessionExpiredHandler(handler: (() => void) | null): void {
    onSessionExpired = handler;
}

/**
 * Alias for {@link setSessionExpiredHandler}.
 *
 * Kept for compatibility with existing imports that use the older name.
 * Prefer `setSessionExpiredHandler` in new code.
 *
 * @param handler - Zero-argument function to invoke on session expiry,
 *                  or `null` to deregister.
 */
export function registerSessionExpiredHandler(handler: (() => void) | null): void {
    setSessionExpiredHandler(handler);
}

/**
 * Creates an `AbortController` that fires after `timeoutMs` milliseconds,
 * along with a `cancel` function to clear the timer when the request
 * completes before the deadline.
 *
 * @param timeoutMs - Timeout duration in milliseconds.
 * @returns `{ controller, cancel }` — pass `controller.signal` to `fetch`
 *          and call `cancel()` in a `finally` block.
 */
function withTimeout(timeoutMs: number): { controller: AbortController; cancel: () => void } {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    return {
        controller,
        cancel: () => window.clearTimeout(timeoutId),
    };
}

/**
 * Reads the response body as text and attempts to parse it as JSON.
 *
 * Resolution order:
 * 1. Returns `null` for an empty body.
 * 2. Returns the raw text string for non-`application/json` content types.
 * 3. Attempts `JSON.parse`; returns the raw text if parsing throws.
 *
 * @param response - The raw `Response` object from `fetch`.
 * @returns The parsed body value, or `null` for empty responses.
 */
async function parseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";
    const rawText = await response.text();

    if (!rawText) {
        return null;
    }

    if (contentType.includes("application/json")) {
        try {
            return JSON.parse(rawText);
        } catch {
            return rawText;
        }
    }

    return rawText;
}

/**
 * Attempts to silently renew the access token using the stored refresh token.
 *
 * **Cookie mode** (`isCookieAuth === true`): sends an empty POST to
 * `auth/refresh/` with `credentials: "include"`. The server reads the
 * HttpOnly refresh cookie and responds with a new access token.
 *
 * **Local mode** (`isCookieAuth === false`): reads the refresh token from
 * `tokenStore`, sends it in the request body, and persists any rotated
 * refresh token that the server returns.
 *
 * On success the new access token is written to `tokenStore`.
 *
 * @returns `true` if a new access token was obtained, `false` otherwise.
 */
const refreshAccessToken = async (): Promise<boolean> => {
    if (isCookieAuth) {
        const response = await fetch(new URL("auth/refresh/", baseUrl), {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({}),
        });

        if (!response.ok) return false;

        const data = await response.json();
        if (!data?.access) return false;

        tokenStore.setAccess(data.access);
        return true;
    }

    const refresh = tokenStore.getRefresh();
    if (!refresh) return false;

    const response = await fetch(new URL("auth/refresh/", baseUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data?.access) return false;

    tokenStore.setAccess(data.access);

    if (data?.refresh) {
        tokenStore.setRefresh(data.refresh);
    }

    return true;
};

/**
 * Accepted value types for individual query string parameters.
 *
 * `null` and `undefined` are accepted but filtered out by {@link buildUrl}
 * so they never appear as `?key=null` in the URL.
 */
type QueryParamValue = string | number | boolean | null | undefined;

/**
 * A plain object whose values will be serialised as query string parameters.
 *
 * Typed as `object` so callers can pass any shaped record without casting.
 * {@link buildUrl} casts internally to `Record<string, QueryParamValue>`.
 */
type QueryParams = object;

/**
 * Appends `params` as a query string to `path` and returns a fully-qualified
 * `URL` based on `baseUrl`.
 *
 * Entries whose value is `undefined`, `null`, or `""` are silently skipped
 * so optional filters never appear as `?search=undefined` in the URL.
 *
 * @param path - API path relative to `baseUrl` (e.g. `"projects/"`).
 * @param params - Optional key/value pairs to encode as query parameters.
 * @returns A `URL` object ready to pass to `fetch`.
 *
 * @example
 * ```ts
 * buildUrl("projects/", { page: 2, page_size: 10, search: "alpha" })
 * // → URL("http://127.0.0.1:8000/api/projects/?page=2&page_size=10&search=alpha")
 *
 * buildUrl("projects/", { page: 1, search: undefined })
 * // → URL("http://127.0.0.1:8000/api/projects/?page=1")
 * ```
 */
function buildUrl(path: string, params?: QueryParams): URL {
    const url = new URL(path, baseUrl);

    if (params) {
        Object.entries(params as Record<string, QueryParamValue>).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                url.searchParams.append(key, String(value));
            }
        });
    }

    return url;
}

/**
 * Options accepted by the internal `request` function. and forwarded
 * from each verb helper on {@link FetchInstance}.
 */
interface RequestOptions {
    /** HTTP method. Defaults to `"GET"`. */
    method?: string;
    /** Additional headers merged after `Content-Type`, `Accept`, and `Authorization`. */
    headers?: HeadersInit;
    /** Raw request body. JSON-serialised by the caller for mutation verbs. */
    body?: BodyInit | null;
    /** Query parameters appended to the URL via {@link buildUrl}. */
    params?: QueryParams;
    /** Request timeout in milliseconds. Defaults to `5000`. */
    timeout?: number;
}

/**
 * Core request function shared by all {@link FetchInstance} verb helpers.
 *
 * ### Auth header
 * Reads the current access token from `tokenStore` on every call and injects
 * `Authorization: Bearer <token>` when one is present.
 *
 * ### 401 handling
 * On a `401` from any non-auth endpoint:
 * 1. Calls {@link refreshAccessToken} to silently renew the token.
 * 2. If renewal succeeds, retries the original request once with the new token.
 * 3. If renewal fails, calls `tokenStore.clear()`, fires the registered
 *    session-expiry handler, and throws an `ApiError` with
 *    `code: "SESSION_EXPIRED"`.
 *
 * Auth endpoints (`auth/*`) are excluded from the retry loop to prevent
 * infinite refresh cycles.
 *
 * ### Errors
 * - Non-2xx responses throw an `ApiError` with `status`, `data`, and `response`.
 * - Aborted requests (timeout) throw an `ApiError` with `code: "ECONNABORTED"`.
 *
 * @typeParam T - Expected shape of the parsed response body.
 * @param path - API path relative to `baseUrl`.
 * @param options - Optional request configuration.
 * @returns A {@link FetchResponse} wrapping the parsed body and response metadata.
 */
async function request<T = unknown>(
    path: string,
    {
        method = "GET",
        headers = {},
        body,
        params,
        timeout = 5000,
    }: RequestOptions = {}
): Promise<FetchResponse<T>> {
    const { controller, cancel } = withTimeout(timeout);

    const doFetch = async () => {
        const access = tokenStore.getAccess();

        // Explicitly typed as Record<string, string> so the union never
        // includes { Authorization?: undefined }, which is not assignable
        // to HeadersInit.
        const authHeader: Record<string, string> = access
            ? { Authorization: `Bearer ${access}` }
            : {};

        return fetch(buildUrl(path, params), {
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
        let response = await doFetch();
        let data = await parseBody(response);

        const isAuthEndpoint = path.startsWith("auth/");
        const shouldAttemptRefresh = response.status === 401 && !isAuthEndpoint;

        if (shouldAttemptRefresh) {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                response = await doFetch();
                data = await parseBody(response);
            } else {
                tokenStore.clear();
                onSessionExpired?.();

                const sessionError = new Error("Session expired. Please log in again.") as ApiError;
                sessionError.status = 401;
                sessionError.code = "SESSION_EXPIRED";
                throw sessionError;
            }
        }

        if (!response.ok) {
            const error = new Error(`Request failed with status ${response.status}`) as ApiError;
            error.status = response.status;
            error.data = data;
            error.response = { status: response.status, data };
            throw error;
        }

        return {
            data: data as T,
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
        };
    } catch (error) {
        if ((error as DOMException)?.name === "AbortError") {
            const timeoutError = new Error(`Request timed out after ${timeout}ms`) as ApiError;
            timeoutError.code = "ECONNABORTED";
            throw timeoutError;
        }

        throw error;
    } finally {
        cancel();
    }
}

/**
 * Pre-configured HTTP client used throughout the application.
 *
 * Each method maps to an HTTP verb and returns
 * `Promise<`{@link FetchResponse}`<T>>`. All methods share the auth injection,
 * token refresh, timeout, and error-normalisation behaviour of the internal
 * `request` function.
 *
 * @example
 * ```ts
 * // GET with query parameters
 * const res = await FetchInstance.get<ProjectRecord[]>("projects/", {
 *     params: { page: 2, page_size: 10, search: "alpha" },
 * });
 *
 * // POST with a JSON body
 * const res = await FetchInstance.post<ProjectRecord>("projects/", payload);
 *
 * // PUT (full replace)
 * await FetchInstance.put(`projects/${id}/`, updatedPayload);
 *
 * // DELETE
 * await FetchInstance.delete(`projects/${id}/`);
 * ```
 */
const FetchInstance = {
    /**
     * Sends a `GET` request.
     *
     * @typeParam T - Expected response body type.
     * @param path - API path relative to the base URL.
     * @param options - Optional headers, query params, and timeout.
     */
    get: <T = unknown>(
        path: string,
        options?: { headers?: HeadersInit; params?: QueryParams; timeout?: number }
    ) => request<T>(path, { ...options, method: "GET" }),

    /**
     * Sends a `DELETE` request.
     *
     * @typeParam T - Expected response body type (usually `void` or `null`).
     * @param path - API path relative to the base URL.
     * @param options - Optional headers and timeout.
     */
    delete: <T = unknown>(
        path: string,
        options?: { headers?: HeadersInit; timeout?: number }
    ) => request<T>(path, { ...options, method: "DELETE" }),

    /**
     * Sends a `POST` request with a JSON-serialised body.
     *
     * @typeParam T - Expected response body type.
     * @param path - API path relative to the base URL.
     * @param data - Request payload. Serialised to JSON automatically.
     * @param options - Optional headers and timeout.
     */
    post: <T = unknown>(
        path: string,
        data?: unknown,
        options?: { headers?: HeadersInit; timeout?: number }
    ) => request<T>(path, {
        ...options,
        method: "POST",
        body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

    /**
     * Sends a `PUT` request with a JSON-serialised body.
     *
     * @typeParam T - Expected response body type.
     * @param path - API path relative to the base URL.
     * @param data - Request payload. Serialised to JSON automatically.
     * @param options - Optional headers and timeout.
     */
    put: <T = unknown>(
        path: string,
        data?: unknown,
        options?: { headers?: HeadersInit; timeout?: number }
    ) => request<T>(path, {
        ...options,
        method: "PUT",
        body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

    /**
     * Sends a `PATCH` request with a JSON-serialised body.
     *
     * @typeParam T - Expected response body type.
     * @param path - API path relative to the base URL.
     * @param data - Request payload. Serialised to JSON automatically.
     * @param options - Optional headers and timeout.
     */
    patch: <T = unknown>(
        path: string,
        data?: unknown,
        options?: { headers?: HeadersInit; timeout?: number }
    ) => request<T>(path, {
        ...options,
        method: "PATCH",
        body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
};

export default FetchInstance;
