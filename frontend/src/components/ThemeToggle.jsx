import React from 'react';

const KEY = 'bs-theme';

export default function ThemeToggle() {
    const getInitial = () => {
        const saved = localStorage.getItem(KEY);
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const [theme, setTheme] = React.useState(getInitial);

    React.useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem(KEY, theme);
    }, [theme]);

    const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

    return (
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={toggle}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
    );
}
