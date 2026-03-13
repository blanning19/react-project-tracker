/**
 * @file Hook for consuming the authentication context.
 *
 * @module auth/useAuth
 */

import { useContext } from "react";

import { AuthContext } from "./authContext";
import type { AuthContextValue } from "./authContext";

/**
 * Returns the current authentication context value.
 *
 * @throws An error if called outside of an `AuthProvider` tree.
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

export default useAuth;