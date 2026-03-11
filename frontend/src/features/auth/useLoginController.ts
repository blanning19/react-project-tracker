/**
 * @file Controller hook for the Login page.
 *
 * @module auth/useLoginController
 */

import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginRequest } from "../../shared/auth/authApi";
import { useAuth } from "../../shared/auth/AuthProvider";

/**
 * Controller hook for the Login page.
 *
 * Manages the form field values, submission state, and error message for the
 * login flow. On success, stores the received tokens via `AuthProvider.login`
 * and redirects to the page the user was trying to reach (or `/` by default).
 *
 * ### Return shape
 * The hook returns controlled field values, change handlers, and a submit
 * handler — all that `LoginView` needs with no direct dependency on the
 * controller's internal state type.
 *
 * @returns Controlled form state and handlers for `LoginView`.
 *
 * @example
 * ```tsx
 * function Login() {
 *   const controller = useLoginController();
 *   return <LoginView {...controller} />;
 * }
 * ```
 */
export const useLoginController = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * The path to redirect to after a successful login.
     * Falls back to `/` when no `from` state was set by `RequireAuth`.
     */
    const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

    /**
     * Handles form submission: calls the login endpoint, stores the tokens,
     * and redirects. Sets a user-facing error message on failure.
     *
     * Error mapping:
     * - `401` → "Invalid username or password."
     * - Any other error → "Could not connect. Please try again."
     *
     * @param event - The native form submission event. `preventDefault` is
     *   called automatically.
     */
    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const tokens = await loginRequest(username, password);
            auth.login(tokens);
            navigate(from, { replace: true });
        } catch (err) {
            const status = (err as { status?: number })?.status
                ?? (err as { response?: { status?: number } })?.response?.status;

            if (status === 401) {
                setError("Invalid username or password.");
            } else {
                setError("Could not connect. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        /** Current value of the username field. */
        username,
        /** Current value of the password field. */
        password,
        /** User-facing error message, or `""` when no error is present. */
        error,
        /** `true` while the login request is in-flight. */
        isSubmitting,
        /** Update the username field value. */
        onUsernameChange: setUsername,
        /** Update the password field value. */
        onPasswordChange: setPassword,
        onSubmit,
    };
};
