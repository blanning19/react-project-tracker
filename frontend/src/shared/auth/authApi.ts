/**
 * @file HTTP functions for the authentication endpoints.
 *
 * Wraps the raw `FetchInstance` calls so the rest of the app never has to
 * know which URL or body shape the auth endpoints expect.
 *
 * @module auth/authApi
 */

import FetchInstance from "../http/fetchClient";
import { isCookieAuth } from "./mode";
import { tokenStore } from "./tokens";

/**
 * Shape of the token pair returned by a successful login.
 *
 * Both fields are optional because cookie-mode responses do not include
 * readable token strings — the server writes HttpOnly cookies directly.
 */
export interface LoginResponse {
    /** Short-lived JWT used in `Authorization: Bearer` headers. */
    access?: string;
    /** Long-lived JWT used to obtain a new access token via the refresh endpoint. */
    refresh?: string;
}

/**
 * Sends username and password to the login endpoint and returns the token pair.
 *
 * The caller is responsible for persisting the returned tokens via
 * {@link tokenStore} or the `AuthProvider` login handler.
 *
 * @param username - The user's login name.
 * @param password - The user's password (sent over HTTPS only).
 * @returns A promise that resolves to a {@link LoginResponse} containing the
 *   access and/or refresh tokens.
 * @throws An `ApiError` with `status: 401` when credentials are invalid.
 *
 * @example
 * ```ts
 * const tokens = await loginRequest("alice", "s3cr3t");
 * tokenStore.setAccess(tokens.access ?? null);
 * ```
 */
export const loginRequest = async (
    username: string,
    password: string
): Promise<LoginResponse> => {
    const response = await FetchInstance.post<LoginResponse>("auth/login/", {
        username,
        password,
    });

    return response.data;
};

/**
 * Sends a logout request to the backend to blacklist the current refresh token.
 *
 * - In **local mode**: the refresh token is sent in the request body so the
 *   server can blacklist it.
 * - In **cookie mode**: the server reads the refresh token from the HttpOnly
 *   cookie automatically; no body is needed.
 *
 * This call is best-effort — callers should always clear local auth state
 * regardless of whether this request succeeds.
 *
 * @returns A promise that resolves when the server has processed the logout.
 *
 * @example
 * ```ts
 * try {
 *   await logoutRequest();
 * } catch {
 *   // best-effort — proceed with local logout anyway
 * }
 * tokenStore.clear();
 * ```
 */
export const logoutRequest = async (): Promise<void> => {
    const refresh = isCookieAuth ? undefined : tokenStore.getRefresh();
    await FetchInstance.post("auth/logout/", refresh ? { refresh } : {});
};
