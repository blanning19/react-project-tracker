import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isCookieAuth } from "../../shared/auth/mode";
import { tokenStore } from "../../shared/auth/tokens";
import FetchInstance from "../../shared/http/fetchClient";

export const useLoginController = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const res = await FetchInstance.post<{ access?: string; refresh?: string }>(
                "auth/login/",
                { username, password }
            );
            tokenStore.setAccess(res.data.access ?? null);
            if (!isCookieAuth) tokenStore.setRefresh(res.data.refresh ?? null);
            navigate(from, { replace: true });
        } catch (err) {
            // Distinguish a credentials failure (401) from a network/server error
            // so users know whether to retry or check their username/password.
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

    // Return handler functions, not raw setState dispatchers.
    // This keeps LoginView's prop contract stable and consistent with
    // every other view in the app.
    return {
        username,
        password,
        error,
        isSubmitting,
        onUsernameChange: setUsername,
        onPasswordChange: setPassword,
        onSubmit,
    };
};
