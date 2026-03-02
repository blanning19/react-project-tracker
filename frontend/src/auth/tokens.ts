let inMemoryAccess: string | null = null;

export const tokenStore = {
    getAccess(): string | null {
        return inMemoryAccess || sessionStorage.getItem("access") || localStorage.getItem("access");
    },
    setAccess(token: string | null) {
        inMemoryAccess = token;
        if (token) {
            sessionStorage.setItem("access", token);
            localStorage.setItem("access", token);
        } else {
            sessionStorage.removeItem("access");
            localStorage.removeItem("access");
        }
    },
    getRefresh(): string | null {
        return localStorage.getItem("refresh");
    },
    setRefresh(token: string | null) {
        if (token) localStorage.setItem("refresh", token);
        else localStorage.removeItem("refresh");
    },
    clear() {
        inMemoryAccess = null;
        sessionStorage.removeItem("access");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
    },
};
