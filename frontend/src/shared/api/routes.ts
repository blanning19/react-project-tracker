export const API = {
    auth: { login: "auth/login/", refresh: "auth/refresh/", logout: "auth/logout/" },
    me: "me/",
    projects: { list: "projects/", detail: (id: string | number) => `projects/${id}/` },
    managers: "managers/",
    employees: "employees/",
};
