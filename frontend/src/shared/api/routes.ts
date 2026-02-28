export const API = {
    auth: { login: "auth/login/", refresh: "auth/refresh/", logout: "auth/logout/" },
    me: "me/",
    projects: { list: "project/", detail: (id: string | number) => `project/${id}/` },
    projectManagers: "projectmanager/",
    employees: "employees/",
};
