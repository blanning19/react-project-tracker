import FetchInstance from "../../../shared/http/fetchClient";
import { API } from "../../../shared/api/routes";
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
//
// Centralising query keys here means:
// - keys are typed (no raw string arrays scattered across the app)
// - invalidation is easy: queryClient.invalidateQueries({ queryKey: projectKeys.all })
// - all keys follow a consistent hierarchy: ["projects"] > ["projects", "list", params]
//
// Usage:
//   useQuery({ queryKey: projectKeys.list(params), queryFn: ... })
//   useQuery({ queryKey: projectKeys.detail(id), queryFn: ... })
//   useQuery({ queryKey: lookupKeys.managers(), queryFn: ... })
//   useQuery({ queryKey: lookupKeys.employees(), queryFn: ... })

export const projectKeys = {
    all: () => ["projects"] as const,
    lists: () => ["projects", "list"] as const,
    list: (params: ProjectListParams) => ["projects", "list", params] as const,
    detail: (id: string | number) => ["projects", "detail", String(id)] as const,
};

export const lookupKeys = {
    all: () => ["lookups"] as const,
    managers: () => ["lookups", "managers"] as const,
    employees: () => ["lookups", "employees"] as const,
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
 * Fetches a single project record by id.
 */
export const getProject = async (id: string | number): Promise<ProjectRecord> => {
    const res = await FetchInstance.get<ProjectRecord>(API.projects.detail(id));
    return res.data;
};

/**
 * Creates a project using the backend write contract.
 *
 * REMARK: payload is strongly typed now. This prevents accidental drift
 * between form mapping logic and the API contract.
 */
export const createProject = async (
    payload: ProjectWritePayload
): Promise<ProjectRecord> => {
    const res = await FetchInstance.post<ProjectRecord>(API.projects.list, payload);
    return res.data;
};

/**
 * Updates a project using the backend write contract.
 *
 * REMARK: payload is strongly typed now. This makes create/update APIs
 * consistent and removes the old `unknown` escape hatch.
 */
export const updateProject = async (
    id: string | number,
    payload: ProjectWritePayload
): Promise<ProjectRecord> => {
    const res = await FetchInstance.put<ProjectRecord>(API.projects.detail(id), payload);
    return res.data;
};

/**
 * Deletes a project by id.
 */
export const deleteProject = async (id: string | number) =>
    FetchInstance.delete(API.projects.detail(id));

// ---------------------------------------------------------------------------
// Lookup API functions (used by form dropdowns)
// ---------------------------------------------------------------------------
//
// Manager and Employee viewsets have pagination_class = NoPagination on the
// backend, so these always return a flat array (never a paginated envelope).

export const getManagers = async (): Promise<PersonOption[]> => {
    const res = await FetchInstance.get<PersonOption[]>(API.managers);
    return res.data;
};

export const getEmployees = async (): Promise<PersonOption[]> => {
    const res = await FetchInstance.get<PersonOption[]>(API.employees);
    return res.data;
};