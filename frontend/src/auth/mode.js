// src/auth/mode.js
// Auth modes:
// - "local": refresh token stored in localStorage (minimal changes, higher XSS risk)
// - "cookie": refresh token stored in HttpOnly cookie (best-practice; requires backend + CORS/CSRF config)

export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || "local";
export const isCookieAuth = AUTH_MODE === "cookie";
