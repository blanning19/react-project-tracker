import Dayjs from "dayjs";
import * as yup from "yup";
import type { ProjectFormValues, ProjectRecord, SecurityLevel } from "../models/project.types";

/**
 * FIX: STATUS_OPTIONS now matches the backend Project.Status TextChoices exactly.
 *
 * The previous options were:
 *   { id: "Open", name: "Open" }
 *   { id: "In progress", name: "In progress" }
 *   { id: "Completed", name: "Completed" }
 *
 * The backend models.py now enforces:
 *   Active | On Hold | Completed | Cancelled
 *
 * Mismatched values mean:
 * - The frontend status filter silently fails to match backend data.
 * - The API accepts values the backend rejects, or worse, stores invalid data.
 * - The HomeView status badge switch falls through to "secondary" for all rows.
 *
 * Keep this list in sync with api/models.py Project.Status whenever
 * new statuses are added on the backend.
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
 * FIX: status validation now uses .oneOf() to match the backend TextChoices.
 *
 * Previously status was validated only as yup.string().required(), meaning
 * any non-empty string would pass frontend validation and be sent to the API.
 * The backend now rejects values outside the allowed set, so we enforce the
 * same constraint on the frontend to give users a clear error before the
 * request is even made.
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

export const projectToFormValues = (project: ProjectRecord): ProjectFormValues => {
    const pm = project?.projectmanager ?? "";
    const emps = project?.employees ?? [];

    return {
        name: project?.name ?? "",
        comments: project?.comments ?? "",
        status: project?.status ?? "",
        projectmanager: String(typeof pm === "object" && pm ? pm.id : pm),
        employees: emps
            .map((employee) =>
                String(typeof employee === "object" && employee ? employee.id : employee)
            )
            .filter(Boolean),
        start_date: project?.start_date ? Dayjs(project.start_date).format("YYYY-MM-DD") : "",
        end_date: project?.end_date ? Dayjs(project.end_date).format("YYYY-MM-DD") : "",
        security_level: (project?.security_level ?? "Internal") as SecurityLevel,
    };
};

export const formToPayload = (data: ProjectFormValues) => ({
    name: data?.name ?? "",
    projectmanager: Number(data?.projectmanager),
    employees: (data?.employees ?? []).map(Number),
    status: data?.status ?? "",
    comments: data?.comments ?? "",
    start_date: data?.start_date ? Dayjs(data.start_date).format("YYYY-MM-DD") : null,
    end_date: data?.end_date ? Dayjs(data.end_date).format("YYYY-MM-DD") : null,
    security_level: data.security_level ?? "",
});
