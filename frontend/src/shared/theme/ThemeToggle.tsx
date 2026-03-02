import { useEffect, useState } from "react";

/**
 * Storage key used to persist the user's selected Bootstrap theme.
 */
const THEME_STORAGE_KEY = "bs-theme";

/**
 * Supported theme values for the application.
 */
type ThemeMode = "light" | "dark";

/**
 * Returns the initial theme to use when the component mounts.
 *
 * Priority:
 * 1. saved theme from localStorage
 * 2. system/browser preference
 * 3. light mode fallback
 */
function getInitialTheme(): ThemeMode {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

    const prefersDarkMode = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDarkMode ? "dark" : "light";
}

/**
 * Toggles the application's Bootstrap light/dark theme.
 */
export default function ThemeToggle(): JSX.Element {
    const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const handleToggleTheme = () => {
        setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
    };

    const buttonLabel =
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

    return (
        <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleToggleTheme}
            aria-label={buttonLabel}
            title={buttonLabel}
        >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
    );
}