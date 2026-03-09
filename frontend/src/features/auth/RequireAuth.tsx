import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthProvider";

function getTokenExp(token: string): number | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const payload = parts[1];
        if (!payload) return null;

        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return typeof decoded.exp === "number" ? decoded.exp : null;
    } catch {
        return null;
    }
}

function isTokenExpired(token: string): boolean {
    const exp = getTokenExp(token);
    if (exp === null) return true;
    return Date.now() / 1000 >= exp;
}

export default function RequireAuth(): JSX.Element {
    const { accessToken } = useAuth();
    const location = useLocation();

    if (!accessToken || isTokenExpired(accessToken)) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: { pathname: location.pathname } }}
            />
        );
    }

    return <Outlet />;
}