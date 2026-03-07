import { NavigateFunction } from "react-router-dom";
import { isCookieAuth } from "./mode";
import { tokenStore } from "./tokens";
import { API } from "../api/routes";
import FetchInstance from "../http/fetchClient";

/**
 * Logs the user out by:
 * 1. Calling the backend logout endpoint to blacklist the refresh token.
 * 2. Clearing all local token state.
 * 3. Redirecting to /login.
 *
 * FIX: The previous implementation only cleared local state (tokenStore.clear())
 * without notifying the backend. This meant the refresh token remained valid on
 * the server until it naturally expired, even after the user logged out.
 *
 * Now the backend blacklists the refresh token on logout so it cannot be reused
 * even if someone obtained a copy of it.
 *
 * The backend call is best-effort: if it fails (e.g. network error, token already
 * expired), we still clear local state and redirect. The user is always logged out
 * from the frontend perspective regardless of the server response.
 */
export const logout = async (navigate: NavigateFunction): Promise<void> => {
    // Attempt to blacklist the refresh token on the server.
    // In local mode: send the refresh token in the request body.
    // In cookie mode: the server reads it from the HttpOnly cookie automatically.
    try {
        const refresh = isCookieAuth ? undefined : tokenStore.getRefresh();
        await FetchInstance.post(API.auth.logout, refresh ? { refresh } : {});
    } catch {
        // Best-effort — always proceed with local logout even if the server call fails.
        // Common failure cases: token already expired, network unavailable.
    }

    // Always clear local token state and redirect, regardless of server response.
    tokenStore.clear();
    navigate("/login", { replace: true });
};
