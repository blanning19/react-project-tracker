import { isCookieAuth } from "../../auth/mode";
import { tokenStore } from "../../auth/tokens";
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
 *
 * Responsibilities:
 * - create an AbortController for the request
 * - start a timer that aborts the request after the provided timeout
 * - return a cancel function so the timeout can always be cleaned up in `finally`
 *
 * Params:
 * - ms: number of milliseconds to wait before aborting the request
 *
 * Returns:
 * - controller: AbortController used by fetch
 * - cancel: function that clears the timeout timer
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
 *
 * Behavior:
 * - returns null when the response body is empty
 * - returns parsed JSON when the response content type is JSON
 * - returns plain text when the response is not JSON
 * - safely falls back to raw text if JSON parsing fails
 *
 * Why this helper exists:
 * - centralizes response parsing in one place
 * - allows the request layer to handle JSON and non-JSON responses consistently
 * - avoids repeating response parsing logic in every API request
 *
 * Params:
 * - res: fetch Response object
 *
 * Returns:
 * - parsed JSON object
 * - plain text
 * - null when the body is empty
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
 * Supported auth modes:
 * 1. Cookie auth mode
 *    - sends a refresh request with credentials included
 *    - expects the backend to identify the refresh token from cookies/session
 *
 * 2. Token auth mode
 *    - reads the refresh token from tokenStore
 *    - posts the refresh token to the backend explicitly
 *
 * Success behavior:
 * - stores the new access token in tokenStore
 * - stores a new refresh token as well when the backend returns one
 *
 * Failure behavior:
 * - returns false instead of throwing so the caller can decide how to handle
 *   the original 401 response
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

/**
 * Core HTTP request helper used by all FetchInstance methods.
 *
 * Responsibilities:
 * - build the full request URL
 * - apply default headers
 * - include an Authorization header when an access token exists
 * - apply cookie credentials behavior when cookie auth is enabled
 * - enforce request timeout behavior using AbortController
 * - parse the response body
 * - detect expired-token responses and attempt one token refresh + retry
 * - normalize successful responses into a shared FetchResponse shape
 * - normalize failed responses into an ApiError shape
 *
 * Token refresh behavior:
 * - when the response is 401 and the parsed response body contains
 *   `code === "token_not_valid"`, the client attempts to refresh the access token
 * - if refresh succeeds, the original request is retried once
 *
 * Params:
 * - path: relative API path such as `project/` or `auth/me/`
 * - options:
 *   - method: HTTP method to use
 *   - headers: additional request headers
 *   - body: optional request body
 *   - timeout: request timeout in milliseconds
 *
 * Returns:
 * - a normalized FetchResponse<T> object on success
 *
 * Throws:
 * - ApiError when the request fails with a non-OK response
 * - ApiError with code `ECONNABORTED` when the request times out
 */
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
        /**
         * First request attempt.
         */
        let res = await doFetch();
        let data = await parseBody(res);

        /**
         * If the backend says the token is invalid/expired, try refreshing the
         * access token once and then retry the original request.
         */
        if (res.status === 401 && (data as { code?: string } | null)?.code === "token_not_valid") {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                res = await doFetch();
                data = await parseBody(res);
            }
        }

        /**
         * Convert non-OK responses into the shared ApiError shape so the rest
         * of the app can handle HTTP failures consistently.
         */
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

        /**
         * Successful response path.
         *
         * The response is normalized into a consistent shape that includes:
         * - parsed data
         * - HTTP status
         * - success flag
         * - headers converted into a plain object
         */
        return {
            data: data as T,
            status: res.status,
            ok: res.ok,
            headers: Object.fromEntries(res.headers.entries()),
        };
    } catch (err) {
        /**
         * Convert fetch abort errors caused by timeout into a friendlier
         * ApiError shape with a recognizable timeout code.
         */
        if ((err as DOMException)?.name === "AbortError") {
            const timeoutErr = new Error(`Request timed out after ${timeout}ms`) as ApiError;
            timeoutErr.code = "ECONNABORTED";
            throw timeoutErr;
        }

        throw err;
    } finally {
        /**
         * Always clear the timeout timer once the request completes, fails,
         * or throws. This prevents timer leaks across repeated requests.
         */
        cancel();
    }
}

/**
 * Public HTTP client used by the frontend application.
 *
 * Each method delegates to the shared `request()` helper while applying:
 * - the correct HTTP method
 * - JSON stringification for body-based requests
 *
 * Available methods:
 * - get
 * - delete
 * - post
 * - put
 * - patch
 */
const FetchInstance = {
    /**
     * Sends a GET request.
     */
    get: <T = unknown>(path: string, options?: { headers?: HeadersInit; timeout?: number }) =>
        request<T>(path, {
            ...options,
            method: "GET",
        }),

    /**
     * Sends a DELETE request.
     */
    delete: <T = unknown>(path: string, options?: { headers?: HeadersInit; timeout?: number }) =>
        request<T>(path, {
            ...options,
            method: "DELETE",
        }),

    /**
     * Sends a POST request with a JSON body.
     */
    post: <T = unknown>(
        path: string,
        data: unknown,
        options?: { headers?: HeadersInit; timeout?: number }
    ) =>
        request<T>(path, {
            ...options,
            method: "POST",
            body: JSON.stringify(data),
        }),

    /**
     * Sends a PUT request with a JSON body.
     */
    put: <T = unknown>(
        path: string,
        data: unknown,
        options?: { headers?: HeadersInit; timeout?: number }
    ) =>
        request<T>(path, {
            ...options,
            method: "PUT",
            body: JSON.stringify(data),
        }),

    /**
     * Sends a PATCH request with a JSON body.
     */
    patch: <T = unknown>(
        path: string,
        data: unknown,
        options?: { headers?: HeadersInit; timeout?: number }
    ) =>
        request<T>(path, {
            ...options,
            method: "PATCH",
            body: JSON.stringify(data),
        }),
};

export default FetchInstance;