/**
 * @file React context provider for application-wide authentication state.
 *
 * Exposes `isAuthenticated`, token management, and the `login`/`logout`
 * actions to the entire component tree via `useAuth()`.
 *
 * @module auth/AuthProvider
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { logoutRequest, type LoginResponse } from "./authApi";
import { isCookieAuth } from "./mode";
import { tokenStore } from "./tokens";
import { registerSessionExpiredHandler } from "../http/fetchClient";

/**
 * Shape of the value provided by `AuthContext`.
 *
 * Consumers access this via {@link useAuth}.
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

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Props for {@link AuthProvider}.
 */
export interface AuthProviderProps {
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
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
    const navigate = useNavigate();
    const [accessToken, setAccessToken] = useState<string | null>(() => tokenStore.getAccess());

    /** Clears all local token state and resets the in-React access token. */
    const clearLocalAuth = useCallback(() => {
        tokenStore.clear();
        setAccessToken(null);
    }, []);

    /**
     * Stores tokens after a successful login and syncs the React access token state.
     * In cookie mode, only the access token is stored client-side.
     */
    const login = useCallback((tokens: LoginResponse) => {
        tokenStore.setAccess(tokens.access ?? null);

        if (!isCookieAuth) {
            tokenStore.setRefresh(tokens.refresh ?? null);
        }

        setAccessToken(tokens.access ?? null);
    }, []);

    /**
     * Clears local auth state and redirects to `/login`.
     * Called by the HTTP client via the registered session-expiry handler.
     */
    const handleSessionExpired = useCallback(() => {
        clearLocalAuth();
        navigate("/login", { replace: true });
    }, [clearLocalAuth, navigate]);

    /**
     * Calls the backend logout endpoint (best-effort), then clears local state
     * and redirects to `/login` regardless of the server response.
     */
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

/**
 * Returns the current authentication context value.
 *
 * @throws An error if called outside of an {@link AuthProvider} tree.
 *
 * @example
 * ```tsx
 * const { isAuthenticated, logout } = useAuth();
 * ```
 */
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider.");
    }

    return context;
}
