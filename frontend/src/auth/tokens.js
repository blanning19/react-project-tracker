// src/auth/tokens.js
// Minimal hardening:
// - keep the access token in-memory when possible
// - mirror access in sessionStorage (survives refresh, but clears on browser close)
// - keep refresh in localStorage (see README for the "best" cookie-based option)

let inMemoryAccess = null;

export const tokenStore = {
    getAccess() {
        return inMemoryAccess || sessionStorage.getItem("access");
    },
    setAccess(token) {
        inMemoryAccess = token;
        if (token) {
            sessionStorage.setItem("access", token);
        } else {
            sessionStorage.removeItem("access");
        }
    },
    getRefresh() {
        return localStorage.getItem("refresh");
    },
    setRefresh(token) {
        if (token) {
            localStorage.setItem("refresh", token);
        } else {
            localStorage.removeItem("refresh");
        }
    },
    clear() {
        inMemoryAccess = null;
        sessionStorage.removeItem("access");
        localStorage.removeItem("refresh");
    },
};
