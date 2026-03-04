import Dayjs from "dayjs";
import * as yup from "yup";
import type { ProjectFormValues, ProjectRecord } from "../models/project.types";

export const STATUS_OPTIONS = [
    { id: "", name: "None" },
    { id: "Open", name: "Open" },
    { id: "In progress", name: "In progress" },
    { id: "Completed", name: "Completed" },
];

export const SECURITY_LEVEL_OPTIONS = [
    { id: "Public", name: "Public" },
    { id: "Internal", name: "Internal" },
    { id: "Confidential", name: "Confidential" },
    { id: "Restricted", name: "Restricted" },
];

export const DEFAULT_VALUES: ProjectFormValues = { name: "", comments: "", status: "", projectmanager: "", employees: [], start_date: "", end_date: "", security_level: "Internal" };

export const PROJECT_SCHEMA: yup.ObjectSchema<ProjectFormValues> = yup.object({
    name: yup.string().required("Name is a required field"),
    projectmanager: yup.string().required("Project manager is a required field"),
    status: yup.string().required("Status is a required field"),
    employees: yup.array(yup.string().required()).min(1, "Pick at least one option from the select field").required(),
    comments: yup.string().default(""),
    start_date: yup.string().required("Start date is a required field"),
    end_date: yup.string().required("End date is a required field").test("end-after-start", "The end date can not be before the start date", function (value) { return !value || !this.parent.start_date || value >= this.parent.start_date; }),
    security_level: yup.string().oneOf(["Public", "Internal", "Confidential", "Restricted"], "Security level is invalid").required("Security level is a required field"),
}).required();

export const projectToFormValues = (project: ProjectRecord): ProjectFormValues => {
    const pm = project?.projectmanager ?? "";
    const emps = project?.employees ?? [];

    return {
        name: project?.name ?? "",
        comments: project?.comments ?? "",
        status: project?.status ?? "",
        projectmanager: String(typeof pm === "object" && pm ? pm.id : pm),
        employees: emps.map((employee) => String(typeof employee === "object" && employee ? employee.id : employee)).filter(Boolean),
        start_date: project?.start_date ? Dayjs(project.start_date).format("YYYY-MM-DD") : "",
        end_date: project?.end_date ? Dayjs(project.end_date).format("YYYY-MM-DD") : "",
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
