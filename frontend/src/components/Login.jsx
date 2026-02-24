import { useState } from 'react';
import FetchInstance from './fetchClient';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr('');

        try {
            const res = await FetchInstance.post('auth/login/', { username, password });
            localStorage.setItem('access', res.data.access);
            localStorage.setItem('refresh', res.data.refresh);
            navigate(from, { replace: true });
        } catch (err) {
            setErr('Login failed');
        }
    };

    return (
        <div style={{ maxWidth: 360, margin: '40px auto' }}>
            <h3>Login</h3>
            {err && <div style={{ color: 'red' }}>{err}</div>}

            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>Username</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%' }} />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>

                <button type="submit">Login</button>
            </form>
        </div>
    );
}
