export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || "local";
export const isCookieAuth = AUTH_MODE === "cookie";
