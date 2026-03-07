/**
 * Keeps a copy of the current access token in memory for fast access during the
 * current browser session.
 *
 * Security note:
 * - Access tokens are intentionally NOT stored in localStorage.
 * - localStorage is accessible to any JavaScript on the page (XSS risk).
 * - Memory is cleared on tab/browser close, which is the desired behavior
 *   for short-lived access tokens.
 * - sessionStorage survives page navigation within the same tab but is cleared
 *   when the tab is closed, making it an acceptable secondary fallback.
 */
let inMemoryAccess: string | null = null;

/**
 * Centralized token storage helper used by the authentication layer.
 *
 * What this store is responsible for:
 * - Reading the current access token
 * - Persisting/removing the access token
 * - Reading the refresh token
 * - Persisting/removing the refresh token
 * - Clearing all authentication state during logout or auth reset
 *
 * Storage behavior:
 * - Access token:
 *   - stored in memory (primary)
 *   - mirrored to sessionStorage (tab-scoped fallback for page reloads)
 *   - NOT stored in localStorage (XSS risk — localStorage is readable by
 *     any JS on the page, making it unsuitable for access tokens)
 * - Refresh token:
 *   - stored in localStorage only (must survive tab close for silent re-auth)
 */
export const tokenStore = {
    /**
     * Returns the current access token.
     *
     * Lookup order:
     * 1. in-memory token (fastest, most current)
     * 2. sessionStorage (survives page reload within the same tab)
     *
     * localStorage is intentionally NOT checked here.
     * Access tokens must not persist beyond the current browser session.
     *
     * Returns:
     * - the access token string when found
     * - null when no access token exists
     */
    getAccess(): string | null {
        return inMemoryAccess || sessionStorage.getItem("access");
    },

    /**
     * Saves or removes the access token.
     *
     * When a token is provided:
     * - update the in-memory copy
     * - write the token to sessionStorage
     *
     * When null is provided:
     * - clear the in-memory copy
     * - remove the token from sessionStorage
     *
     * localStorage is intentionally NOT written here.
     * Access tokens are short-lived and must not outlive the browser session.
     *
     * Params:
     * - token: the new access token to store, or null to remove it
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
     * Returns the current refresh token from localStorage.
     *
     * Why only localStorage:
     * - Refresh tokens are meant to survive page reloads and tab close/reopen
     *   so the app can silently obtain a new access token without forcing login.
     * - The backend enforces refresh token rotation and blacklisting, which
     *   limits the damage window if a refresh token is ever compromised.
     *
     * Returns:
     * - the refresh token string when present
     * - null when no refresh token exists
     */
    getRefresh(): string | null {
        return localStorage.getItem("refresh");
    },

    /**
     * Saves or removes the refresh token in localStorage.
     *
     * When a token is provided:
     * - persist it to localStorage
     *
     * When null is provided:
     * - remove any stored refresh token
     *
     * Params:
     * - token: the new refresh token to store, or null to remove it
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
     * This should be called during:
     * - logout
     * - token invalidation
     * - forced auth reset after refresh failure
     *
     * What gets cleared:
     * - in-memory access token
     * - sessionStorage access token
     * - localStorage refresh token
     */
    clear() {
        inMemoryAccess = null;
        sessionStorage.removeItem("access");
        localStorage.removeItem("refresh");
    },
};
