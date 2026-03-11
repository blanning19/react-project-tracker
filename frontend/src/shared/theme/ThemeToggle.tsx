/**
 * @file Light/dark theme toggle button.
 *
 * @module shared/theme/ThemeToggle
 */

import { useEffect, useState } from "react";

/**
 * `localStorage` key used to persist the user's selected Bootstrap theme
 * across browser sessions.
 */
const THEME_STORAGE_KEY = "bs-theme";

/**
 * Supported Bootstrap theme values for the application.
 */
type ThemeMode = "light" | "dark";

/**
 * Returns the initial theme to use when the component mounts.
 *
 * Resolution order:
 * 1. Saved theme from `localStorage`
 * 2. System preference via the `prefers-color-scheme` media query
 * 3. `"light"` as the final fallback
 *
 * @returns The theme that should be active on first render.
 */
function getInitialTheme(): ThemeMode {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

    const prefersDarkMode = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDarkMode ? "dark" : "light";
}

/**
 * Toggles the application's Bootstrap light/dark theme.
 *
 * On each render the selected theme is written to `localStorage` and applied
 * to `document.documentElement` via the `data-bs-theme` attribute so
 * Bootstrap picks up the correct color tokens globally.
 *
 * @returns A button that switches between light and dark mode.
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
            {/* FIX: Replaced mojibake-encoded emoji characters with HTML entities.
                Previous code rendered as: â˜€ï¸ Light / ðŸŒ™ Dark
                Caused by curly-quote/emoji corruption from a non-UTF-8 source. */}
            {theme === "dark" ? "\u2600\uFE0F Light" : "\uD83C\uDF19 Dark"}
        </button>
    );
}
