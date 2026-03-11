/**
 * @file Route guard that redirects unauthenticated users to the login page.
 *
 * @module auth/RequireAuth
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthProvider";

/**
 * Decodes the `exp` claim from a JWT without verifying the signature.
 *
 * Used for a client-side expiry pre-check so that a visibly expired token
 * never reaches the API layer. The server always performs authoritative
 * verification — this check is defence-in-depth only.
 *
 * @param token - A base64url-encoded JWT string.
 * @returns The `exp` Unix timestamp in seconds, or `null` if it cannot be read.
 */
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

/**
 * Returns `true` if the token's `exp` claim is in the past.
 *
 * Returns `true` (expired) when the claim cannot be read, so that malformed
 * tokens are treated as expired rather than valid.
 *
 * @param token - A JWT string to check.
 * @returns `true` if the token is expired or unreadable.
 */
function isTokenExpired(token: string): boolean {
    const exp = getTokenExp(token);
    if (exp === null) return true;
    return Date.now() / 1000 >= exp;
}

/**
 * Route guard component for protected routes.
 *
 * Renders the child route via `<Outlet />` when the user has a valid,
 * non-expired access token. Otherwise redirects to `/login`, passing the
 * current pathname in `location.state.from` so the login page can redirect
 * back after a successful login.
 *
 * ### Usage
 * Wrap protected routes with this component in the React Router tree:
 *
 * ```tsx
 * <Route element={<RequireAuth />}>
 *   <Route path="/" element={<Home />} />
 *   <Route path="/create" element={<Create />} />
 *   <Route path="/edit/:id" element={<Edit />} />
 * </Route>
 * ```
 */
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
