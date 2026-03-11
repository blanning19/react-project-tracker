/**
 * @file Token storage layer for JWT-based authentication.
 *
 * Manages access and refresh token persistence across the two storage tiers:
 * - **Access token** — memory (primary) + sessionStorage (tab-scoped fallback)
 * - **Refresh token** — localStorage only (must survive tab close for silent re-auth)
 *
 * @module auth/tokens
 */

/**
 * In-memory copy of the current access token.
 *
 * Kept in module scope so reads are synchronous and do not touch the DOM.
 * Intentionally NOT stored in localStorage — localStorage is readable by any
 * JavaScript on the page and is therefore unsuitable for short-lived credentials.
 *
 * The value is mirrored to `sessionStorage` so it survives page reloads within
 * the same tab, but is cleared when the tab is closed.
 */
let inMemoryAccess: string | null = null;

/**
 * Centralised token storage helper used by the authentication layer.
 *
 * ### Storage tiers
 *
 * | Token   | Memory | sessionStorage | localStorage |
 * |---------|--------|----------------|--------------|
 * | Access  | ✅ primary | ✅ fallback  | ❌ XSS risk  |
 * | Refresh | ❌       | ❌             | ✅ only      |
 *
 * ### Why two tiers for access tokens?
 * Memory is fastest and most secure, but is wiped on page reload.
 * sessionStorage survives navigation within the same tab and acts as a
 * reload-safe fallback without persisting beyond the browser session.
 *
 * ### Why localStorage for refresh tokens?
 * Refresh tokens must outlive page reloads and tab-close/reopen cycles so
 * the app can silently obtain a new access token without forcing login.
 * The backend enforces rotation and blacklisting, which limits the damage
 * window if a refresh token is ever compromised.
 *
 * @example
 * ```ts
 * // Store tokens after a successful login
 * tokenStore.setAccess(tokens.access ?? null);
 * tokenStore.setRefresh(tokens.refresh ?? null);
 *
 * // Read the access token to attach to an Authorization header
 * const access = tokenStore.getAccess();
 *
 * // Clear everything on logout
 * tokenStore.clear();
 * ```
 */
export const tokenStore = {
    /**
     * Returns the current access token.
     *
     * Lookup order:
     * 1. In-memory value (fastest, most current)
     * 2. `sessionStorage` (survives page reload within the same tab)
     *
     * `localStorage` is intentionally **not** checked — access tokens must not
     * persist beyond the current browser session.
     *
     * @returns The access token string, or `null` when no token is present.
     */
    getAccess(): string | null {
        return inMemoryAccess || sessionStorage.getItem("access");
    },

    /**
     * Persists or removes the access token.
     *
     * - When a non-null token is supplied, the in-memory copy and
     *   `sessionStorage` entry are both updated.
     * - When `null` is supplied, both storage locations are cleared.
     *
     * `localStorage` is intentionally **not** written — access tokens are
     * short-lived and must not outlive the browser session.
     *
     * @param token - The new access token to store, or `null` to remove it.
     */
    setAccess(token: string | null) {
        inMemoryAccess = token;

        if (token) {
            sessionStorage.setItem("access", token);
        } else {
            sessionStorage.removeItem("access");
        }
    },

    /**
     * Returns the current refresh token from `localStorage`.
     *
     * Refresh tokens are stored only in `localStorage` because they must
     * survive page reloads and tab-close/reopen cycles for silent re-auth.
     * The backend enforces rotation and blacklisting to limit exposure.
     *
     * @returns The refresh token string, or `null` when no token is present.
     */
    getRefresh(): string | null {
        return localStorage.getItem("refresh");
    },

    /**
     * Persists or removes the refresh token in `localStorage`.
     *
     * @param token - The new refresh token to store, or `null` to remove it.
     */
    setRefresh(token: string | null) {
        if (token) {
            localStorage.setItem("refresh", token);
        } else {
            localStorage.removeItem("refresh");
        }
    },

    /**
     * Clears all authentication state managed by this token store.
     *
     * Should be called during logout, token invalidation, or a forced auth
     * reset after a failed refresh attempt.
     *
     * **What gets cleared:**
     * - In-memory access token
     * - `sessionStorage` access token entry
     * - `localStorage` refresh token entry
     */
    clear() {
        inMemoryAccess = null;
        sessionStorage.removeItem("access");
        localStorage.removeItem("refresh");
    },
};
