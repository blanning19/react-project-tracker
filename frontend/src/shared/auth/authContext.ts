/**
 * @file React context object and shared types for application-wide authentication state.
 *
 * @module auth/authContext
 */

import { createContext } from "react";

import type { LoginResponse } from "./authApi";

/**
 * Shape of the value provided by `AuthContext`.
 *
 * Consumers access this via `useAuth`.
 */
export interface AuthContextValue {
    /** The current access token, or `null` when logged out. */
    accessToken: string | null;
    /** Convenience boolean derived from `accessToken`. `true` when logged in. */
    isAuthenticated: boolean;
    /**
     * Persists the token pair received after a successful login and marks the
     * user as authenticated.
     * @param tokens - The `LoginResponse` returned by `loginRequest`.
     */
    login: (tokens: LoginResponse) => void;
    /**
     * Logs the user out: calls the backend logout endpoint (best-effort),
     * clears all local token state, and redirects to `/login`.
     */
    logout: () => Promise<void>;
    /**
     * Called by the HTTP client when the access-token refresh flow fails.
     * Clears local auth state and redirects to `/login` without attempting
     * another server call.
     */
    handleSessionExpired: () => void;
}

/**
 * Authentication context consumed by `useAuth` and provided by
 * `AuthProvider`.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);