/**
 * @file Centralised API route paths used by the fetch client.
 *
 * All path strings live here so that a backend URL change requires edits
 * in exactly one file rather than being scattered across every API module.
 *
 * Paths are relative to the base URL configured in `fetchClient.ts`.
 *
 * @module shared/api/routes
 */

/**
 * API route map for the entire application.
 *
 * @example
 * ```ts
 * // GET /api/projects/
 * FetchInstance.get(API.projects.list);
 *
 * // GET /api/projects/42/
 * FetchInstance.get(API.projects.detail(42));
 * ```
 */
export const API = {
    auth: { login: "auth/login/", refresh: "auth/refresh/", logout: "auth/logout/" },
    me: "me/",
    projects: { list: "projects/", detail: (id: string | number) => `projects/${id}/` },
    managers: "managers/",
    employees: "employees/",
};
