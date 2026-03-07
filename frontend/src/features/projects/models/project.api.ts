import FetchInstance from "../../../shared/http/fetchClient";
import { API } from "../../../shared/api/routes";
import type {
    PaginatedResponse,
    PersonOption,
    ProjectListParams,
    ProjectRecord,
} from "./project.types";

// ---------------------------------------------------------------------------
// React Query key factories
// ---------------------------------------------------------------------------
//
// Centralising query keys here means:
// - keys are typed (no raw string arrays scattered across the app)
// - invalidation is easy: queryClient.invalidateQueries({ queryKey: projectKeys.all })
// - all keys follow a consistent hierarchy:  ["projects"] > ["projects", "list", params]
//
// Usage:
//   useQuery({ queryKey: projectKeys.list(params), queryFn: ... })
//   useQuery({ queryKey: projectKeys.detail(id),   queryFn: ... })
//   useQuery({ queryKey: lookupKeys.managers(),     queryFn: ... })
//   useQuery({ queryKey: lookupKeys.employees(),    queryFn: ... })

export const projectKeys = {
    all:    ()                          => ["projects"]                        as const,
    lists:  ()                          => ["projects", "list"]                as const,
    list:   (params: ProjectListParams) => ["projects", "list", params]        as const,
    detail: (id: string | number)       => ["projects", "detail", String(id)]  as const,
};

export const lookupKeys = {
    all:       () => ["lookups"]               as const,
    managers:  () => ["lookups", "managers"]   as const,
    employees: () => ["lookups", "employees"]  as const,
};

// ---------------------------------------------------------------------------
// Project API functions
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated list of projects.
 *
 * All filtering, searching, ordering and pagination is handled server-side.
 * Pass ProjectListParams to control which page/filter/sort the API applies.
 *
 * The backend always returns a PaginatedResponse envelope:
 *   { count, next, previous, results: ProjectRecord[] }
 *
 * Note: normalizeListResponse has been removed. Now that pagination params
 * are explicit, the API always returns the paginated envelope — there is no
 * ambiguity to normalize away.
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

export const getProject = async (id: string | number): Promise<ProjectRecord> => {
    const res = await FetchInstance.get<ProjectRecord>(API.projects.detail(id));
    return res.data;
};

export const createProject = async (payload: unknown) =>
    FetchInstance.post<ProjectRecord>(API.projects.list, payload);

export const updateProject = async (id: string | number, payload: unknown) =>
    FetchInstance.put<ProjectRecord>(API.projects.detail(id), payload);

export const deleteProject = async (id: string | number) =>
    FetchInstance.delete(API.projects.detail(id));

// ---------------------------------------------------------------------------
// Lookup API functions (used by form dropdowns)
// ---------------------------------------------------------------------------
//
// Manager and Employee viewsets have pagination_class = NoPagination on the
// backend, so these always return a flat array (never a paginated envelope).

export const getProjectManagers = async (): Promise<PersonOption[]> => {
    const res = await FetchInstance.get<PersonOption[]>(API.projectManagers);
    return res.data;
};

export const getEmployees = async (): Promise<PersonOption[]> => {
    const res = await FetchInstance.get<PersonOption[]>(API.employees);
    return res.data;
};
