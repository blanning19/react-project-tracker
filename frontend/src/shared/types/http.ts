/**
 * @file Shared HTTP types used by the fetch client and error-handling layer.
 *
 * Keeping these in a dedicated module avoids circular imports between
 * `fetchClient.ts` and the auth/error utilities that also need these shapes.
 *
 * @module shared/types/http
 */

/**
 * Shape of an error thrown by the fetch client on non-2xx responses,
 * timeouts, and session-expiry events.
 *
 * The fetch client attaches `status`, `data`, `code`, and `response` to a
 * standard `Error` object so catch blocks can inspect the details without
 * an `as unknown` cast.
 *
 * @example
 * ```ts
 * try {
 *   await FetchInstance.get("projects/");
 * } catch (err) {
 *   const apiErr = err as ApiError;
 *   if (apiErr.status === 404) { ... }
 *   if (apiErr.code === "SESSION_EXPIRED") { ... }
 * }
 * ```
 */
export interface ApiError extends Error {
    /** HTTP status code of the failed response, if available. */
    status?: number;
    /**
     * Machine-readable error code for non-HTTP errors.
     * - `"ECONNABORTED"` — request timed out.
     * - `"SESSION_EXPIRED"` — token refresh failed; user must log in again.
     */
    code?: string;
    /** Parsed response body from the failed request, if available. */
    data?: unknown;
    /**
     * Axios-compatible nested shape that mirrors `error.response.status` /
     * `error.response.data`. Populated alongside the flat fields for
     * compatibility with error-handling utilities that support both shapes.
     */
    response?: {
        status?: number;
        data?: unknown;
    };
}

/**
 * Typed wrapper around a successful HTTP response returned by the fetch client.
 *
 * @typeParam T - The expected shape of the parsed response body.
 *
 * @example
 * ```ts
 * const res: FetchResponse<ProjectRecord[]> = await FetchInstance.get("projects/");
 * console.log(res.data);   // ProjectRecord[]
 * console.log(res.status); // 200
 * ```
 */
export interface FetchResponse<T = unknown> {
    /** Parsed response body. */
    data: T;
    /** HTTP status code. */
    status: number;
    /** `true` for 2xx responses. */
    ok: boolean;
    /** Response headers as a plain key/value record. */
    headers: Record<string, string>;
}
