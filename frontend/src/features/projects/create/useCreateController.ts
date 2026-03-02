import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { createProject, getEmployees, getProjectManagers } from "../models/project.api";
import type { PersonOption, ProjectFormValues } from "../models/project.types";
import { DEFAULT_VALUES, formToPayload, PROJECT_SCHEMA } from "../shared/projectFormConfig";

export const useCreateController = () => {
    const [projectManagers, setProjectManagers] = useState<PersonOption[]>([]);
    const [employees, setEmployees] = useState<PersonOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");
    const navigate = useNavigate();
    const form = useForm<ProjectFormValues>({ defaultValues: DEFAULT_VALUES, resolver: yupResolver(PROJECT_SCHEMA) });

    useEffect(() => {
        const getData = async () => {
            setApiError("");

            try {
                const [projectManagerData, employeeData] = await Promise.all([getProjectManagers(), getEmployees()]);
                setProjectManagers(projectManagerData);
                setEmployees(employeeData);
            } catch (err) {
                console.error("GET lookup data failed:", (err as { response?: { status?: number; data?: unknown } })?.response?.status, (err as { response?: { data?: unknown } })?.response?.data ?? err);
                setApiError("Failed to load dropdown data.");
            } finally {
                setLoading(false);
            }
        };

        getData();
    }, []);

    const submission = async (data: ProjectFormValues) => {
        setApiError("");
        const payload = formToPayload(data);

        try {
            await createProject(payload);
            navigate("/");
        } catch (err) {
            const status = (err as { response?: { status?: number }; status?: number })?.response?.status ?? (err as { status?: number })?.status;
            const body = (err as { response?: { data?: Record<string, string[]> }; data?: Record<string, string[]> })?.response?.data ?? (err as { data?: Record<string, string[]> })?.data;
            console.error("POST projects failed:", status, body ?? err);

            if (body && typeof body === "object") setApiError(Object.values(body).flat().join(" ") || "Validation error.");
            else setApiError("Request failed. Check console for details.");
        }
    };

    return { ...form, submission, projectManagers, employees, loading, apiError };
};
