import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate, useParams } from "react-router-dom";
import { getEmployees, getProject, getProjectManagers, updateProject } from "../models/project.api";
import type { PersonOption, ProjectFormValues } from "../models/project.types";
import { DEFAULT_VALUES, formToPayload, PROJECT_SCHEMA, projectToFormValues } from "../shared/projectFormConfig";

export const useEditController = () => {
    const { id: projectId = "" } = useParams();
    const [projectManagers, setProjectManagers] = useState<PersonOption[]>([]);
    const [employees, setEmployees] = useState<PersonOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");
    const navigate = useNavigate();
    const form = useForm<ProjectFormValues>({ defaultValues: DEFAULT_VALUES, resolver: yupResolver(PROJECT_SCHEMA) });
    const { setValue } = form;

    useEffect(() => {
        const getData = async () => {
            setApiError("");
            setLoading(true);

            try {
                const [projectManagerData, employeeData, projectData] = await Promise.all([getProjectManagers(), getEmployees(), getProject(projectId)]);
                setProjectManagers(projectManagerData);
                setEmployees(employeeData);
                const formValues = projectToFormValues(projectData);
                Object.entries(formValues).forEach(([key, value]) => setValue(key as keyof ProjectFormValues, value, { shouldValidate: false, shouldDirty: false }));
            } catch (err) {
                console.error("Edit GetData failed:", (err as { response?: { status?: number; data?: unknown } })?.response?.status, (err as { response?: { data?: unknown } })?.response?.data ?? err);
                setApiError("Failed to load project data.");
            } finally {
                setLoading(false);
            }
        };

        if (projectId) getData();
    }, [projectId, setValue]);

    const submission = async (data: ProjectFormValues) => {
        setApiError("");

        try {
            await updateProject(projectId, formToPayload(data));
            navigate("/");
        } catch (err) {
            const status = (err as { response?: { status?: number }; status?: number })?.response?.status ?? (err as { status?: number })?.status;
            const body = (err as { response?: { data?: Record<string, string[]> }; data?: Record<string, string[]> })?.response?.data ?? (err as { data?: Record<string, string[]> })?.data;
            console.error("PUT project failed:", status, body ?? err);

            if (body && typeof body === "object") setApiError(Object.values(body).flat().join(" ") || "Validation error.");
            else if (status) setApiError(`Request failed (${status}).`);
            else setApiError("An unexpected error occurred.");
        }
    };

    return { ...form, submission, projectManagers, employees, loading, apiError };
};
