/**
 * @file Authentication mode configuration.
 *
 * Reads the `VITE_AUTH_MODE` environment variable at build time to determine
 * whether the app should use token-based or HttpOnly-cookie-based auth.
 *
 * Set `VITE_AUTH_MODE=cookie` in your `.env` file to enable cookie mode.
 * Any other value (or the absence of the variable) defaults to `"local"`.
 *
 * @module auth/mode
 */

/**
 * The resolved authentication mode for this build.
 *
 * Possible values:
 * - `"local"` — JWTs are stored client-side (memory + localStorage).
 * - `"cookie"` — The server issues HttpOnly cookies; no tokens are stored
 *   in JavaScript-accessible storage.
 *
 * @example
 * ```ts
 * if (AUTH_MODE === "cookie") {
 *   // omit Authorization header; the browser sends the cookie automatically
 * }
 * ```
 */
export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || "local";

/**
 * Convenience boolean derived from {@link AUTH_MODE}.
 *
 * Use this flag instead of comparing `AUTH_MODE` directly so that the
 * string literal `"cookie"` only appears in one place.
 *
 * @example
 * ```ts
 * const refresh = isCookieAuth ? undefined : tokenStore.getRefresh();
 * ```
 */
export const isCookieAuth = AUTH_MODE === "cookie";
