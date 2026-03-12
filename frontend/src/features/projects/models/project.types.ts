/**
 * @file Shared TypeScript types for the project domain.
 *
 * Contains the canonical type definitions for API responses, form state, and
 * query parameters used across the project feature.
 *
 * @module projects/models/project.types
 */

/**
 * Classification level of a project, matching the backend `SecurityLevel`
 * choice field.
 *
 * Keep in sync with `api/models.py Project.SecurityLevel`.
 */
export type SecurityLevel = "Public" | "Internal" | "Confidential" | "Restricted";

/**
 * Shape of a manager record returned by the `/api/managers/` lookup endpoint.
 *
 * `name` is always present and non-null — `Manager.name` is a required
 * `CharField(unique=True)` on the backend with no `blank=True` or `null=True`.
 * `ManagerSerializer` always serialises it.
 *
 * Kept separate from {@link EmployeeOption} because the two serialisers have
 * different field sets: managers expose `name` while employees expose
 * `first_name`, `last_name`, and `email`.
 */
export interface ManagerOption {
    /** Primary key of the manager record. */
    id: number;
    /** Display name — always present, never null. */
    name: string;
}

/**
 * Shape of an employee record returned by the `/api/employees/` lookup endpoint.
 *
 * All string fields map directly to `EmployeeSerializer`'s field list:
 * `("id", "first_name", "last_name", "email")`.
 */
export interface EmployeeOption {
    /** Primary key of the employee record. */
    id: number;
    first_name: string;
    last_name: string;
    /** Unique email address — always present from the serialiser. */
    email: string;
}

/**
 * Union type used where a field can hold either a manager or an employee,
 * e.g. in the generic `getPersonName` helper in `ProjectFormFields`.
 *
 * Prefer the concrete types ({@link ManagerOption} / {@link EmployeeOption})
 * at call sites where the origin is known.
 */
export type PersonOption = ManagerOption | EmployeeOption;

/**
 * Shape of a project record returned by `GET /api/projects/` and
 * `GET /api/projects/:id/` (`ProjectReadSerializer`).
 *
 * ### Nullability notes
 * - `comments` — the DB column is `null=True` so the API can return `null`
 *   for rows created before the NOT NULL migration. New rows always store `""`
 *   thanks to the serialiser default, but the type must accept `null` for
 *   backwards compatibility with existing data.
 * - `start_date` / `end_date` — `DateField()` with no `null=True`; the API
 *   always returns an ISO 8601 string. Not typed as nullable.
 * - `manager` — `ForeignKey(SET_NULL, null=True)` so it can be `null` when
 *   the assigned manager has been deleted.
 */
export interface ProjectRecord {
    /** Primary key. */
    id: number;
    /** Project display name. */
    name: string;
    /**
     * Optional free-text notes about the project.
     *
     * The DB column is `null=True` so legacy rows may return `null`.
     * New rows always store `""` (serialiser default). Consumers should
     * normalise with `comments ?? ""` rather than assuming a string.
     */
    comments?: string | null;
    /** Current workflow status (e.g. `"Active"`, `"On Hold"`). */
    status?: string;
    /**
     * ISO 8601 start date string.
     *
     * `DateField()` with no `null=True` — always present in API responses.
     */
    start_date?: string;
    /**
     * ISO 8601 end date string.
     *
     * `DateField()` with no `null=True` — always present in API responses.
     */
    end_date?: string;
    /** The assigned project manager, or `null` if unassigned (SET_NULL). */
    manager?: ManagerOption | null;
    /** List of employees assigned to this project. */
    employees?: EmployeeOption[];
    /** Data classification level for this project. */
    security_level: SecurityLevel;
}

/**
 * Generic paginated envelope returned by DRF list endpoints.
 *
 * @typeParam T - The type of each item in `results`.
 */
export interface PaginatedResponse<T> {
    /** Total number of records matching the current filter (across all pages). */
    count: number;
    /** URL of the next page, or `null` on the last page. */
    next: string | null;
    /** URL of the previous page, or `null` on the first page. */
    previous: string | null;
    /** Records for the current page. */
    results: T[];
}

/**
 * Frontend form state shape managed by React Hook Form.
 *
 * All fields are strings or string arrays because HTML form controls are
 * string-based. The mappers in `projectFormConfig.ts` convert these to the
 * correct types for the API payload.
 */
export interface ProjectFormValues {
    name: string;
    /** Free-text notes. Defaults to `""` — never `null` or `undefined`. */
    comments: string;
    status: string;
    /**
     * String representation of the manager's numeric ID.
     * Maps to the `manager` field in {@link ProjectWritePayload}.
     */
    managerId: string;
    /** String representations of each employee's numeric ID. */
    employees: string[];
    /** ISO 8601 date string or `""` when not set. */
    start_date: string;
    /** ISO 8601 date string or `""` when not set. */
    end_date: string;
    security_level: SecurityLevel;
}

/**
 * Exact payload shape sent to the backend for create and update operations.
 *
 * @remarks
 * - `manager` is a numeric foreign-key ID (not an object).
 * - `employees` is always an array of numeric IDs.
 * - Dates are nullable strings after form normalisation.
 *
 * The explicit type locks the `formToPayload` mapper to the backend write
 * contract. TypeScript will fail at compile time if either side drifts.
 */
export interface ProjectWritePayload {
    name: string;
    /** Always `""` on write — never `null` or `undefined`. */
    comments: string;
    status: string;
    /** Numeric foreign-key ID of the assigned project manager. */
    manager: number;
    /** Numeric foreign-key IDs of all assigned employees. */
    employees: number[];
    /** ISO 8601 date string, or `null` if the date was cleared. */
    start_date: string | null;
    /** ISO 8601 date string, or `null` if the date was cleared. */
    end_date: string | null;
    security_level: SecurityLevel;
}

/**
 * Query parameters accepted by `GET /api/projects/`.
 *
 * All fields are optional. Omitted fields are excluded from the request URL
 * by the `buildUrl` helper in `fetchClient.ts`.
 */
export interface ProjectListParams {
    /** Full-text search applied to project name and comments. */
    search?: string;
    /** Filter by exact status value (e.g. `"Active"`). */
    status?: string;
    /**
     * DRF ordering string. Prefix with `-` for descending order.
     * @example `"name"` for A→Z, `"-name"` for Z→A
     */
    ordering?: string;
    /** 1-based page number. */
    page?: number;
    /** Number of records per page. */
    page_size?: number;
}
