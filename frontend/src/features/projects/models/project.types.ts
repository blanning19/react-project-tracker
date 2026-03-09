export type SecurityLevel = "Public" | "Internal" | "Confidential" | "Restricted";

/**
 * Shape of a person record returned by the API for manager
 * and employee lookups (/api/managers/ and /api/employees/).
 */
export interface PersonOption {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
}

/**
 * Shape of a project record returned by GET /api/projects/ and
 * GET /api/projects/:id/ (ProjectReadSerializer).
 *
 * REMARK: The API still returns `projectmanager` for now.
 * Option A only cleans up the frontend form/UI boundary, not the backend
 * contract. We will translate `projectmanager` <-> `managerId` in
 * projectFormConfig.ts.
 */
export interface ProjectRecord {
    id: number;
    name: string;
    comments?: string;
    status?: string;
    start_date?: string | null;
    end_date?: string | null;
    projectmanager?: PersonOption | null;
    employees?: PersonOption[];
    security_level: SecurityLevel;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

/**
 * Frontend form shape used by React Hook Form.
 *
 * REMARK: Frontend form state now uses `managerId` instead of `projectmanager`
 * so the UI layer has a cleaner, more intentional name. Mapping back to the
 * backend contract happens in projectFormConfig.ts.
 */
export interface ProjectFormValues {
    name: string;
    comments: string;
    status: string;
    managerId: string;
    employees: string[];
    start_date: string;
    end_date: string;
    security_level: SecurityLevel;
}

/**
 * Query parameters accepted by GET /api/projects/.
 *
 * Maps directly to the backend ProjectViewset filter/search/ordering params:
 * - search:        ?search=keyword     (searches name and comments)
 * - status:        ?status=Active      (exact match on status field)
 * - ordering:      ?ordering=name      (prefix with - for descending)
 * - page:          ?page=2
 * - page_size:     ?page_size=25
 *
 * All fields are optional — omitting a param uses the backend default.
 */
export interface ProjectListParams {
    search?: string;
    status?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
}