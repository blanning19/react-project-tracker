export type SecurityLevel = "Public" | "Internal" | "Confidential" | "Restricted";

/**
 * Shape of a person record returned by the API for project manager
 * and employee lookups (/api/projectmanager/ and /api/employees/).
 */
export interface PersonOption {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
}

/**
 * Shape of a project record returned by GET /api/project/ and
 * GET /api/project/:id/ (ProjectReadSerializer).
 *
 * FIX: projectmanager and employees are now always nested objects on reads,
 * never raw IDs. The union types have been tightened to reflect this.
 *
 * The write endpoints (POST/PUT/PATCH) accept IDs — that is handled
 * separately in projectFormConfig.ts via formToPayload().
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
