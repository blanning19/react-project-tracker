import { useEffect, useState } from "react";

const KEY = "bs-theme";

const getInitialTheme = () => {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function ThemeToggle() {
    const [theme, setTheme] = useState<string>(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem(KEY, theme);
    }, [theme]);

    return <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀️ Light" : "🌙 Dark"}</button>;
}
