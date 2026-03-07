export type SecurityLevel = "Public" | "Internal" | "Confidential" | "Restricted";

/**
 * Shape of a person record returned by the API for project manager
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
 * projectmanager and employees are always nested objects on reads.
 * The write endpoints (POST/PUT/PATCH) accept IDs — handled in
 * projectFormConfig.ts via formToPayload().
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

export interface ProjectFormValues {
    name: string;
    comments: string;
    status: string;
    projectmanager: string;
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
