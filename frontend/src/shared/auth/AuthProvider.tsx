/**
 * @file React context provider for application-wide authentication state.
 *
 * Exposes `isAuthenticated`, token management, and the `login`/`logout`
 * actions to the entire component tree via `useAuth()`.
 *
 * @module auth/AuthProvider
 */

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

import { registerSessionExpiredHandler } from "../http/fetchClient";

import { logoutRequest, type LoginResponse } from "./authApi";
import { AuthContext, type AuthContextValue } from "./authContext";
import { isCookieAuth } from "./mode";
import { tokenStore } from "./tokens";

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Provides authentication state and actions to the component tree.
 *
 * ### What it manages
 * - Reads the initial access token from `tokenStore` on mount.
 * - Registers a `handleSessionExpired` callback with the HTTP client so that
 *   the client can trigger a redirect without importing React APIs directly.
 * - Exposes `login`, `logout`, and `handleSessionExpired` as stable callbacks
 *   (all wrapped in `useCallback`) so they can safely appear in dependency arrays.
 *
 * ### Placement
 * Must be rendered inside `BrowserRouter` (needs `useNavigate`) and outside
 * any routes that require authentication.
 *
 * @example
 * ```tsx
 * <BrowserRouter>
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 * </BrowserRouter>
 * ```
 */
export default function AuthProvider({ children }: AuthProviderProps): JSX.Element {
    const navigate = useNavigate();
    const [accessToken, setAccessToken] = useState<string | null>(() => tokenStore.getAccess());

    const clearLocalAuth = useCallback(() => {
        tokenStore.clear();
        setAccessToken(null);
    }, []);

    const login = useCallback((tokens: LoginResponse) => {
        tokenStore.setAccess(tokens.access ?? null);

        if (!isCookieAuth) {
            tokenStore.setRefresh(tokens.refresh ?? null);
        }

        setAccessToken(tokens.access ?? null);
    }, []);

    const handleSessionExpired = useCallback(() => {
        clearLocalAuth();
        navigate("/login", { replace: true });
    }, [clearLocalAuth, navigate]);

    const logout = useCallback(async () => {
        try {
            await logoutRequest();
        } catch {
            // Best-effort server logout. Local auth state is still cleared below.
        } finally {
            clearLocalAuth();
            navigate("/login", { replace: true });
        }
    }, [clearLocalAuth, navigate]);

    useEffect(() => {
        registerSessionExpiredHandler(handleSessionExpired);

        return () => {
            registerSessionExpiredHandler(() => {});
        };
    }, [handleSessionExpired]);

    const value = useMemo<AuthContextValue>(() => {
        return {
            accessToken,
            isAuthenticated: Boolean(accessToken),
            login,
            logout,
            handleSessionExpired,
        };
    }, [accessToken, login, logout, handleSessionExpired]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}