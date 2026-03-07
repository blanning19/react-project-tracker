import { Navigate, Outlet, useLocation } from "react-router-dom";
import { tokenStore } from "../../shared/auth/tokens";

/**
 * Protected layout route — redirects to /login if the user has no valid
 * access token or if the token is expired.
 *
 * Used as a layout route in App.tsx so RequireAuth only needs to appear once:
 *
 *   <Route element={<RequireAuth />}>
 *     <Route path="/"       element={<Home />} />
 *     <Route path="/create" element={<Create />} />
 *   </Route>
 *
 * tokenStore.clear() is called on redirect so stale tokens are removed
 * immediately rather than lingering until the next explicit logout.
 */

function getTokenExp(token: string): number | null {
    try {
        const payload = token.split(".")[1];
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
    const location = useLocation();
    const token = tokenStore.getAccess();

    if (!token || isTokenExpired(token)) {
        tokenStore.clear();
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
