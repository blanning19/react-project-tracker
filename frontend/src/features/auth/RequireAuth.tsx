import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import FetchInstance from "../../shared/http/fetchClient";
import { isCookieAuth } from "../../shared/auth/mode";
import { tokenStore } from "../../shared/auth/tokens";

/**
 * Determines whether a JWT is expired based on its `exp` claim.
 *
 * If parsing fails, treat the token as expired so we fail safe.
 */
const isJwtExpired = (token: string) => {
    try {
        const payloadBase64 = token.split(".")[1];
        const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(payloadJson);
        if (!payload?.exp) return true;
        return Date.now() >= payload.exp * 1000;
    } catch {
        return true;
    }
};

interface RequireAuthProps {
    children: ReactNode;
}

/**
 * Route guard that ensures authenticated access.
 *
 * Behavior:
 * - If a valid access token exists, render immediately.
 * - If access is missing/expired but a refresh path exists, attempt one refresh.
 * - Only redirect to login if refresh is not possible or refresh fails.
 *
 * This prevents "instant logout" on full page reload when the user has a valid refresh token.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
    const location = useLocation();

    const [checking, setChecking] = useState(true);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        const bootstrapAuth = async () => {
            const access = tokenStore.getAccess();

            if (access && !isJwtExpired(access)) {
                setAllowed(true);
                setChecking(false);
                return;
            }

            /**
             * If we have a refresh token (local mode) or cookie auth enabled,
             * attempt one refresh to recover a valid access token on reload.
             */
            const canRefresh = Boolean(tokenStore.getRefresh()) || isCookieAuth;

            if (!canRefresh) {
                tokenStore.clear();
                setAllowed(false);
                setChecking(false);
                return;
            }

            try {
                /**
                 * Trigger a refresh. In cookie mode, the backend reads the refresh cookie.
                 * In local mode, fetchClient will include the refresh token as needed.
                 */
                await FetchInstance.post("auth/refresh/", {});

                const refreshedAccess = tokenStore.getAccess();

                if (refreshedAccess && !isJwtExpired(refreshedAccess)) {
                    setAllowed(true);
                } else {
                    tokenStore.clear();
                    setAllowed(false);
                }
            } catch {
                tokenStore.clear();
                setAllowed(false);
            } finally {
                setChecking(false);
            }
        };

        void bootstrapAuth();
    }, []);

    if (checking) {
        return (
            <div className="d-flex align-items-center gap-2 p-3 text-body-secondary">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Checking session...</span>
            </div>
        );
    }

    if (!allowed) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}