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
 *
 * Security note: this is a client-side expiry check only. It is not a
 * substitute for server-side validation — the API will reject expired tokens
 * regardless. The purpose here is UX: avoid sending a request we already
 * know will fail and redirect the user promptly.
 */

/**
 * Decodes the `exp` claim from a JWT without a library.
 *
 * JWTs are three base64url-encoded segments joined by dots:
 *   header.payload.signature
 *
 * The payload segment contains JSON claims including `exp` (Unix timestamp).
 * We only need to read it — we do not verify the signature here (that is
 * the server's job).
 *
 * Returns null if the token is malformed or the exp claim is missing.
 */
function getTokenExp(token: string): number | null {
    try {
        const parts = token.split(".");
        // A valid JWT always has exactly 3 dot-separated parts.
        // Guard against malformed tokens before indexing.
        if (parts.length !== 3) return null;

        // parts[1] is always defined here because length === 3,
        // but we non-null assert to satisfy noUncheckedIndexedAccess.
        const payload = parts[1]!;

        // base64url → base64: replace URL-safe chars before decoding
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return typeof decoded.exp === "number" ? (decoded.exp as number) : null;
    } catch {
        // Catches: malformed base64, invalid JSON, or any unexpected shape.
        return null;
    }
}

/**
 * Returns true if the token is expired or if its expiry cannot be determined.
 *
 * We treat an unparseable token as expired so the user is always redirected
 * to login rather than silently stuck with a broken auth state.
 */
function isTokenExpired(token: string): boolean {
    const exp = getTokenExp(token);
    if (exp === null) return true;
    // Date.now() is in milliseconds; exp is in seconds.
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
