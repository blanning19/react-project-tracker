export const API = {
    auth: {
        login: 'auth/login/',
        refresh: 'auth/refresh/',
    },
    me: 'me/',
    projects: {
        list: 'project/',
        detail: (id) => `project/${id}/`,
    },
    projectManagers: 'projectmanager/',
    employees: 'employees/',
};
