/**
 * @file API functions and React Query key factories for the project domain.
 *
 * All HTTP calls for projects, managers, and employees live here. Controller
 * hooks import from this module rather than calling `FetchInstance` directly,
 * keeping the data-fetching contract in one place.
 *
 * @module projects/models/project.api
 */

import { API } from "../../../shared/api/routes";
import FetchInstance from "../../../shared/http/fetchClient";

import type {
    PaginatedResponse,
    PersonOption,
    ProjectListParams,
    ProjectRecord,
    ProjectWritePayload,
} from "./project.types";

// ---------------------------------------------------------------------------
// React Query key factories
// ---------------------------------------------------------------------------

/**
 * Typed React Query key factories for project queries.
 *
 * Centralising keys here means:
 * - No raw string arrays scattered across the codebase.
 * - Invalidation is easy: `queryClient.invalidateQueries({ queryKey: projectKeys.all() })`.
 * - All keys follow a consistent hierarchy:
 *   `["projects"]` → `["projects", "list"]` → `["projects", "list", params]`
 *
 * @example
 * ```ts
 * useQuery({ queryKey: projectKeys.list(params), queryFn: () => listProjects(params) });
 * useQuery({ queryKey: projectKeys.detail(id),   queryFn: () => getProject(id) });
 * ```
 */
export const projectKeys = {
    /** Root key — matches every project query. */
    all: () => ["projects"] as const,
    /** Matches all list queries regardless of params. */
    lists: () => ["projects", "list"] as const,
    /**
     * Matches a specific paginated/filtered list query.
     * @param params - The exact params object used as the query key segment.
     */
    list: (params: ProjectListParams) => ["projects", "list", params] as const,
    /**
     * Matches the detail query for a single project.
     * @param id - The project's numeric or string ID.
     */
    detail: (id: string | number) => ["projects", "detail", String(id)] as const,
};

/**
 * Typed React Query key factories for manager and employee lookup queries.
 *
 * These endpoints have `NoPagination` on the backend and always return flat
 * arrays, so their keys are simpler than {@link projectKeys}.
 *
 * @example
 * ```ts
 * useQuery({ queryKey: lookupKeys.managers(),  queryFn: getManagers });
 * useQuery({ queryKey: lookupKeys.employees(), queryFn: getEmployees });
 * ```
 */
export const lookupKeys = {
    /** Root key — matches every lookup query. */
    all: () => ["lookups"] as const,
    /** Key for the managers lookup. */
    managers: () => ["lookups", "managers"] as const,
    /** Key for the employees lookup. */
    employees: () => ["lookups", "employees"] as const,
};

// ---------------------------------------------------------------------------
// Project API functions
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated list of projects from the backend.
 *
 * All filtering, searching, ordering, and pagination is handled server-side.
 * Pass a {@link ProjectListParams} object to control which page, filter, and
 * sort the API applies.
 *
 * @param params - Optional query parameters forwarded to `GET /api/projects/`.
 * @returns A paginated envelope containing the matching project records.
 *
 * @example
 * ```ts
 * const page = await listProjects({ page: 2, status: "Active", ordering: "-name" });
 * console.log(page.count, page.results);
 * ```
 */
export const listProjects = async (
    params: ProjectListParams = {}
): Promise<PaginatedResponse<ProjectRecord>> => {
    const res = await FetchInstance.get<PaginatedResponse<ProjectRecord>>(
        API.projects.list,
        { params }
    );
    return res.data;
};

/**
 * Fetches a single project record by ID.
 *
 * @param id - The numeric or string project ID.
 * @returns The full project record from the read serialiser.
 * @throws `ApiError` with `status: 404` if the project does not exist.
 */
export const getProject = async (id: string | number): Promise<ProjectRecord> => {
    const res = await FetchInstance.get<ProjectRecord>(API.projects.detail(id));
    return res.data;
};

/**
 * Creates a new project via `POST /api/projects/`.
 *
 * The payload is strongly typed so accidental drift between the form mapper
 * and the API contract is caught at compile time.
 *
 * @param payload - The validated write payload produced by `formToPayload`.
 * @returns The newly created project record, including its server-assigned ID.
 * @throws `ApiError` with `status: 400` and field-level messages on validation failure.
 */
export const createProject = async (
    payload: ProjectWritePayload
): Promise<ProjectRecord> => {
    const res = await FetchInstance.post<ProjectRecord>(API.projects.list, payload);
    return res.data;
};

/**
 * Replaces an existing project via `PUT /api/projects/:id/`.
 *
 * Uses a full `PUT` (not `PATCH`) — all required fields must be present.
 *
 * @param id - The project ID to update.
 * @param payload - The complete write payload produced by `formToPayload`.
 * @returns The updated project record.
 * @throws `ApiError` with `status: 400` and field-level messages on validation failure.
 * @throws `ApiError` with `status: 404` if the project does not exist.
 */
export const updateProject = async (
    id: string | number,
    payload: ProjectWritePayload
): Promise<ProjectRecord> => {
    const res = await FetchInstance.put<ProjectRecord>(API.projects.detail(id), payload);
    return res.data;
};

/**
 * Deletes a project via `DELETE /api/projects/:id/`.
 *
 * @param id - The project ID to delete.
 * @returns The raw `FetchResponse` (body is typically empty for 204 responses).
 * @throws `ApiError` with `status: 404` if the project does not exist.
 */
export const deleteProject = async (id: string | number) =>
    FetchInstance.delete(API.projects.detail(id));

// ---------------------------------------------------------------------------
// Lookup API functions (used by form dropdowns)
// ---------------------------------------------------------------------------

/**
 * Fetches all available project managers.
 *
 * The `ManagerViewset` uses `NoPagination`, so this always returns a flat
 * array rather than a paginated envelope.
 *
 * @returns A flat array of {@link PersonOption} records.
 */
export const getManagers = async (): Promise<PersonOption[]> => {
    const res = await FetchInstance.get<PersonOption[]>(API.managers);
    return res.data;
};

/**
 * Fetches all available employees.
 *
 * The `EmployeeViewset` uses `NoPagination`, so this always returns a flat
 * array rather than a paginated envelope.
 *
 * @returns A flat array of {@link PersonOption} records.
 */
export const getEmployees = async (): Promise<PersonOption[]> => {
    const res = await FetchInstance.get<PersonOption[]>(API.employees);
    return res.data;
};
