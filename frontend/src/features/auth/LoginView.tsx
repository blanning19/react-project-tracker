import type { Dispatch, FormEvent, SetStateAction } from "react";

interface LoginViewProps {
    username: string;
    password: string;
    error: string;
    setUsername: Dispatch<SetStateAction<string>>;
    setPassword: Dispatch<SetStateAction<string>>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

const LoginView = ({ username, password, error, setUsername, setPassword, onSubmit }: LoginViewProps) => (
    <div style={{ maxWidth: 360, margin: "40px auto" }}>
        <h3>Login</h3>
        {error && <div style={{ color: "red" }}>{error}</div>}

        <form onSubmit={onSubmit}>
            <div style={{ marginBottom: 12 }}><label>Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%" }} /></div>
            <div style={{ marginBottom: 12 }}><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%" }} /></div>
            <button type="submit">Login</button>
        </form>
    </div>
);

export default LoginView;
