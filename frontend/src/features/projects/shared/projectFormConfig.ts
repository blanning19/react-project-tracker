/**
 * @file Form configuration for the Create and Edit project pages.
 *
 * Centralises:
 * - static dropdown options
 * - default form values
 * - validation schema
 * - API ↔ form mapping helpers
 *
 * @module projects/shared/projectFormConfig
 */

import * as yup from "yup";
import type {
    ManagerOption,
    EmployeeOption,
    ProjectFormValues,
    ProjectRecord,
    ProjectWritePayload,
    SecurityLevel,
} from "../models/project.types";

/**
 * Status options shown in the project status dropdown.
 */
export const STATUS_OPTIONS: Array<{ id: string; name: string }> = [
    { id: "Active", name: "Active" },
    { id: "On Hold", name: "On Hold" },
    { id: "Completed", name: "Completed" },
    { id: "Cancelled", name: "Cancelled" },
];

/**
 * Security level options shown in the project security-level dropdown.
 */
export const SECURITY_LEVEL_OPTIONS: Array<{ id: SecurityLevel; name: string }> = [
    { id: "Public", name: "Public" },
    { id: "Internal", name: "Internal" },
    { id: "Confidential", name: "Confidential" },
    { id: "Restricted", name: "Restricted" },
];

/**
 * Default field values used by React Hook Form.
 */
export const DEFAULT_VALUES: ProjectFormValues = {
    name: "",
    comments: "",
    status: "",
    managerId: "",
    employees: [],
    start_date: "",
    end_date: "",
    security_level: "Internal",
};

const VALID_STATUSES = STATUS_OPTIONS.map((option) => option.id);
const VALID_SECURITY_LEVELS = SECURITY_LEVEL_OPTIONS.map((option) => option.id);

/**
 * Validation schema for the project form.
 */
export const PROJECT_SCHEMA: yup.ObjectSchema<ProjectFormValues> = yup.object({
    name: yup
        .string()
        .required("Name is a required field"),

    managerId: yup
        .string()
        .required("Project manager is a required field")
        .test(
            "non-empty",
            "Project manager is a required field",
            (value) => (value ?? "").trim() !== ""
        ),

    status: yup
        .string()
        .required("Status is required")
        .oneOf(VALID_STATUSES, "Please select a valid status"),

    employees: yup
        .array()
        .of(yup.string().required())
        .required()
        .min(1, "Pick at least one option from the select field"),

    start_date: yup
        .string()
        .required("Start date is a required field"),

    end_date: yup
        .string()
        .required("End date is a required field")
        .test(
            "end-after-start",
            "The end date can not be before the start date",
            function (endDate) {
                const { start_date } = this.parent as ProjectFormValues;
                if (!start_date || !endDate) return true;
                return endDate >= start_date;
            }
        ),

    security_level: yup
        .mixed<SecurityLevel>()
        .oneOf(VALID_SECURITY_LEVELS as SecurityLevel[], "Security level is invalid")
        .required("Security level is required"),

    comments: yup
        .string()
        .default("")
        .when("status", {
            is: (status: string) => status === "Completed" || status === "Cancelled",
            then: (schema) =>
                schema.test(
                    "comments-required-for-closed-status",
                    "Comments are required when a project is Completed or Cancelled",
                    (value) => (value ?? "").trim() !== ""
                ),
            otherwise: (schema) => schema,
        }),
});

/**
 * Converts a manager record into its string ID for form state.
 *
 * `ManagerOption.name` is always present (non-optional), so no fallback
 * to first_name/last_name is needed here.
 *
 * @param value - Manager record from the API, or null/undefined when unassigned.
 * @returns Manager id string, or `""` when no manager is assigned.
 */
function getManagerId(value: ManagerOption | null | undefined): string {
    if (!value) return "";
    return String(value.id);
}

/**
 * Converts employee objects into an array of string ids.
 *
 * @param employees - Employee list from the API.
 * @returns Employee id strings.
 */
function getEmployeeIds(employees?: EmployeeOption[] | null): string[] {
    return (employees ?? []).map((employee) => String(employee.id));
}

/**
 * Converts an API project record into form values.
 *
 * @param project - Project record returned by the API.
 * @returns Form values ready for React Hook Form.
 */
export function projectToFormValues(project: ProjectRecord): ProjectFormValues {
    return {
        name: project.name ?? "",
        // comments is `string | null | undefined` on ProjectRecord (DB column is
        // null=True). Normalise to "" for the form — the textarea never holds null.
        comments: project.comments ?? "",
        status: project.status ?? "",
        managerId: getManagerId(project.manager ?? null),
        employees: getEmployeeIds(project.employees ?? []),
        // start_date / end_date are non-nullable at the DB level but typed as
        // optional on ProjectRecord (they may be absent on partial responses).
        start_date: project.start_date ?? "",
        end_date: project.end_date ?? "",
        security_level: project.security_level ?? "Internal",
    };
}

/**
 * Converts validated form values into the backend write payload.
 *
 * @param data - Validated form values.
 * @returns Payload expected by the backend create/update endpoints.
 */
export function formToPayload(data: ProjectFormValues): ProjectWritePayload {
    return {
        name: data.name,
        comments: data.comments ?? "",
        status: data.status,
        manager: parseInt(data.managerId, 10),
        employees: data.employees.map((id) => parseInt(id, 10)),
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        security_level: data.security_level,
    };
}
