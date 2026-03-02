/**
 * Keeps a copy of the current access token in memory for fast access during the
 * current browser session.
 *
 * Why this exists:
 * - Reading from memory is faster than hitting browser storage every time.
 * - It allows the app to keep using the token even if storage access changes
 *   during runtime.
 * - Browser refreshes will clear this in-memory value, so the storage-backed
 *   fallbacks below still matter.
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
 *   - stored in memory
 *   - mirrored to sessionStorage
 *   - mirrored to localStorage
 * - Refresh token:
 *   - stored in localStorage only
 *
 * Note:
 * This design allows the access token to be recovered from browser storage
 * after a reload while still preferring the faster in-memory value first.
 */
export const tokenStore = {
    /**
     * Returns the current access token.
     *
     * Lookup order:
     * 1. in-memory token
     * 2. sessionStorage
     * 3. localStorage
     *
     * Why this order is used:
     * - Memory is the fastest and most current value during runtime.
     * - sessionStorage survives page navigation within the same tab/session.
     * - localStorage provides a final fallback if the token was persisted there.
     *
     * Returns:
     * - the access token string when found
     * - null when no access token exists anywhere
     */
    getAccess(): string | null {
        return inMemoryAccess || sessionStorage.getItem("access") || localStorage.getItem("access");
    },

    /**
     * Saves or removes the access token everywhere this app tracks it.
     *
     * When a token is provided:
     * - update the in-memory copy
     * - write the token to sessionStorage
     * - write the token to localStorage
     *
     * When null is provided:
     * - clear the in-memory copy
     * - remove the token from sessionStorage
     * - remove the token from localStorage
     *
     * Params:
     * - token: the new access token to store, or null to remove it
     */
    setAccess(token: string | null) {
        inMemoryAccess = token;

        if (token) {
            sessionStorage.setItem("access", token);
            localStorage.setItem("access", token);
        } else {
            sessionStorage.removeItem("access");
            localStorage.removeItem("access");
        }
    },

    /**
     * Returns the current refresh token from localStorage.
     *
     * Why only localStorage:
     * - Refresh tokens are meant to survive page reloads so the app can request
     *   a new access token without forcing the user to log in again.
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
     * This should typically be called during:
     * - logout
     * - token invalidation
     * - forced auth reset after refresh failure
     *
     * What gets cleared:
     * - in-memory access token
     * - sessionStorage access token
     * - localStorage access token
     * - localStorage refresh token
     */
    clear() {
        inMemoryAccess = null;
        sessionStorage.removeItem("access");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
    },
};