import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isCookieAuth } from "../../shared/auth/mode";
import { tokenStore } from "../../shared/auth/tokens";
import FetchInstance from "../../shared/http/fetchClient";

export const useLoginController = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        try {
            const res = await FetchInstance.post<{ access?: string; refresh?: string }>("auth/login/", { username, password });
            tokenStore.setAccess(res.data.access ?? null);
            if (!isCookieAuth) tokenStore.setRefresh(res.data.refresh ?? null);
            navigate(from, { replace: true });
        } catch {
            setError("Login failed");
        }
    };

    return { username, password, error, setUsername, setPassword, onSubmit };
};
