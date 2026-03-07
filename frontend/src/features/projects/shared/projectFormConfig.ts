import Dayjs from "dayjs";
import * as yup from "yup";
import type { ProjectFormValues, ProjectRecord, SecurityLevel } from "../models/project.types";

/**
 * STATUS_OPTIONS matches backend Project.Status TextChoices exactly.
 *
 * Keep in sync with:
 * - backend:  api/models.py Project.Status
 * - frontend: home.types.ts HomeStatusFilter
 * - frontend: home.constants.ts HOME_STATUS_FILTER_OPTIONS
 */
export const STATUS_OPTIONS = [
    { id: "Active", name: "Active" },
    { id: "On Hold", name: "On Hold" },
    { id: "Completed", name: "Completed" },
    { id: "Cancelled", name: "Cancelled" },
];

export const SECURITY_LEVEL_OPTIONS = [
    { id: "Public", name: "Public" },
    { id: "Internal", name: "Internal" },
    { id: "Confidential", name: "Confidential" },
    { id: "Restricted", name: "Restricted" },
];

export const DEFAULT_VALUES: ProjectFormValues = {
    name: "",
    comments: "",
    status: "",
    projectmanager: "",
    employees: [],
    start_date: "",
    end_date: "",
    security_level: "Internal",
};

/**
 * Yup schema for the project form.
 *
 * status and security_level use .oneOf() to match backend TextChoices,
 * so invalid values are rejected on the frontend before the request is made.
 */
export const PROJECT_SCHEMA: yup.ObjectSchema<ProjectFormValues> = yup.object({
    name: yup.string().required("Name is a required field"),
    projectmanager: yup.string().required("Project manager is a required field"),
    status: yup
        .string()
        .oneOf(
            ["Active", "On Hold", "Completed", "Cancelled"],
            "Please select a valid status"
        )
        .required("Status is a required field"),
    employees: yup
        .array(yup.string().required())
        .min(1, "Pick at least one option from the select field")
        .required(),
    comments: yup.string().default(""),
    start_date: yup.string().required("Start date is a required field"),
    end_date: yup
        .string()
        .required("End date is a required field")
        .test(
            "end-after-start",
            "The end date can not be before the start date",
            function (value) {
                return !value || !this.parent.start_date || value >= this.parent.start_date;
            }
        ),
    security_level: yup
        .string()
        .oneOf(
            ["Public", "Internal", "Confidential", "Restricted"],
            "Security level is invalid"
        )
        .required("Security level is a required field"),
}).required();

/**
 * Converts a ProjectRecord (API read shape) into ProjectFormValues (form shape).
 *
 * projectmanager and employees arrive as nested objects on reads; the form
 * fields need their IDs as strings to populate select/checkbox fields.
 */
export const projectToFormValues = (project: ProjectRecord): ProjectFormValues => {
    const pm = project.projectmanager ?? "";
    const emps = project.employees ?? [];

    return {
        name: project.name,
        comments: project.comments ?? "",
        status: project.status ?? "",
        projectmanager: String(typeof pm === "object" && pm ? pm.id : pm),
        employees: emps
            .map((employee) =>
                String(typeof employee === "object" && employee ? employee.id : employee)
            )
            .filter(Boolean),
        start_date: project.start_date ? Dayjs(project.start_date).format("YYYY-MM-DD") : "",
        end_date: project.end_date ? Dayjs(project.end_date).format("YYYY-MM-DD") : "",
        security_level: (project.security_level ?? "Internal") as SecurityLevel,
    };
};

/**
 * Converts ProjectFormValues (form shape) into the API write payload.
 *
 * The form stores IDs as strings (from select elements); the API expects
 * numbers. Dates are normalized to YYYY-MM-DD.
 *
 * Note: `data` is a validated ProjectFormValues object — it is never null
 * or undefined at this point, so optional chaining is not needed here.
 */
export const formToPayload = (data: ProjectFormValues) => ({
    name: data.name,
    projectmanager: Number(data.projectmanager),
    employees: data.employees.map(Number),
    status: data.status,
    comments: data.comments,
    start_date: data.start_date ? Dayjs(data.start_date).format("YYYY-MM-DD") : null,
    end_date: data.end_date ? Dayjs(data.end_date).format("YYYY-MM-DD") : null,
    security_level: data.security_level,
});
