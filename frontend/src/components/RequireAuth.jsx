import { Navigate, useLocation } from "react-router-dom";

import { tokenStore } from "../auth/tokens";

function isJwtExpired(token) {
    try {
        const payloadBase64 = token.split(".")[1];
        const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(payloadJson);

        if (!payload?.exp) return true;

        // exp is in seconds
        return Date.now() >= payload.exp * 1000;
    } catch {
        return true;
    }
}

export default function RequireAuth({ children }) {
    const location = useLocation();
    const token = tokenStore.getAccess();

    if (!token || isJwtExpired(token)) {
        tokenStore.clear();
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}
