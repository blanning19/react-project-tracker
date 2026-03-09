import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginRequest } from "../../shared/auth/authApi";
import { useAuth } from "../../shared/auth/AuthProvider";

export const useLoginController = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

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
        username,
        password,
        error,
        isSubmitting,
        onUsernameChange: setUsername,
        onPasswordChange: setPassword,
        onSubmit,
    };
};