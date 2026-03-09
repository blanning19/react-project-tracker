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

interface AuthContextValue {
    accessToken: string | null;
    isAuthenticated: boolean;
    login: (tokens: LoginResponse) => void;
    logout: () => Promise<void>;
    handleSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
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

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider.");
    }

    return context;
}