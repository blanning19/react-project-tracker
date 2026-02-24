// src/auth/tokens.js
export const tokenStore = {
    getAccess() {
        return localStorage.getItem('access');
    },
    setAccess(token) {
        localStorage.setItem('access', token);
    },
    getRefresh() {
        return localStorage.getItem('refresh');
    },
    setRefresh(token) {
        localStorage.setItem('refresh', token);
    },
    clear() {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
    },
};
