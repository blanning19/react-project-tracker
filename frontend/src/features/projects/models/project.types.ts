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
 * REMARK: API contract is now `manager`, not `projectmanager`.
 * Frontend form state still uses `managerId`, with mapping handled in
 * projectFormConfig.ts.
 */
export interface ProjectRecord {
    id: number;
    name: string;
    comments?: string;
    status?: string;
    start_date?: string | null;
    end_date?: string | null;
    manager?: PersonOption | null;
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
 * Exact payload shape the frontend sends to the backend for create/update.
 *
 * REMARK:
 * - The backend expects `manager` as a numeric foreign-key ID.
 * - Dates are nullable in the API payload after form normalization.
 * - employees is always an array of numeric IDs.
 */
export interface ProjectWritePayload {
    name: string;
    comments: string;
    status: string;
    manager: number;
    employees: number[];
    start_date: string | null;
    end_date: string | null;
    security_level: SecurityLevel;
}

/**
 * Query parameters accepted by GET /api/projects/.
 */
export interface ProjectListParams {
    search?: string;
    status?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
}