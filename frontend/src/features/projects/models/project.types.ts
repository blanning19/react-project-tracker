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
 * ### Contract notes
 * - `comments` may be `null` because the database still allows null values.
 *   UI consumers should normalise with `comments ?? ""` before binding to form
 *   inputs or rendering text content that expects a string.
 * - `manager` is required by current business rules, but is still typed as
 *   nullable for defensive compatibility with older rows or temporary backend
 *   inconsistencies until the database constraint is tightened.
 * - `employees` is always returned as an array by the read serializer.
 * - `start_date` and `end_date` are ISO 8601 date strings in API responses.
 * - `status` and `security_level` should match the backend choice values.
 */
export interface ProjectRecord {
    /** Primary key. */
    id: number;
    /** Project display name. */
    name: string;
    /**
     * Optional free-text notes about the project.
     *
     * The database still allows `NULL`, so API responses may contain `null`.
     * New form submissions normalise this to `""` unless the field is left
     * intentionally null by legacy data.
     */
    comments: string | null;
    /** Current workflow status. */
    status: string;
    /** ISO 8601 project start date string. */
    start_date: string;
    /** ISO 8601 project end date string. */
    end_date: string;
    /**
     * Assigned project manager.
     *
     * Business rules require this to be selected on create/edit. The field is
     * still typed as nullable until the backend model/serializer constraints
     * are fully tightened.
     */
    manager: ManagerOption | null;
    /** Employees assigned to the project. */
    employees: EmployeeOption[];
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
