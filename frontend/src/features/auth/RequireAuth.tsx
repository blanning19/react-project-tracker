import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { tokenStore } from "../../shared/auth/tokens";

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

export default function RequireAuth({ children }: RequireAuthProps) {
    const location = useLocation();
    const token = tokenStore.getAccess();

    if (!token || isJwtExpired(token)) {
        tokenStore.clear();
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}
