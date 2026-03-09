import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    createProject,
    getEmployees,
    getProject,
    getManagers,
    lookupKeys,
    updateProject,
} from "../models/project.api";
import type { ProjectFormValues, ProjectRecord } from "../models/project.types";
import {
    DEFAULT_VALUES,
    formToPayload,
    PROJECT_SCHEMA,
    projectToFormValues,
} from "./projectFormConfig";
import { getApiErrorMessage } from "./getApiErrorMessage";

type ProjectFormMode = "create" | "edit";

interface UseProjectFormControllerArgs {
    mode: ProjectFormMode;
    projectId?: string;
}

/**
 * Shared controller logic for Project Create and Project Edit.
 *
 * Lookup data (managers, employees) and the edit record are fetched with
 * React Query so they can be cached, deduplicated, and explicitly refetched
 * when the user clicks Retry.
 */
export function useProjectFormController({ mode, projectId = "" }: UseProjectFormControllerArgs) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState("");
    const navigate = useNavigate();

    const form = useForm<ProjectFormValues>({
        defaultValues: DEFAULT_VALUES,
        resolver: yupResolver(PROJECT_SCHEMA),
    });
    const { reset } = form;

    // ── Lookup queries ────────────────────────────────────────────────────────

    const managersQuery = useQuery({
        queryKey: lookupKeys.managers(),
        queryFn: getManagers,
        staleTime: 5 * 60 * 1000,
    });

    const employeesQuery = useQuery({
        queryKey: lookupKeys.employees(),
        queryFn: getEmployees,
        staleTime: 5 * 60 * 1000,
    });

    // ── Existing project query (edit only) ───────────────────────────────────

    const projectQuery = useQuery<ProjectRecord>({
        queryKey: ["projects", "detail", projectId],
        queryFn: () => getProject(projectId),
        enabled: mode === "edit" && projectId !== "",
        staleTime: 60_000,
    });

    const projectManagers = managersQuery.data ?? [];
    const employees = employeesQuery.data ?? [];
    const existingProject = projectQuery.data;

    // ── Populate form from edit data ─────────────────────────────────────────

    useEffect(() => {
        if (existingProject) {
            reset(projectToFormValues(existingProject));
        }
    }, [existingProject, reset]);

    // ── Derived loading / error state ────────────────────────────────────────

    const loading =
        managersQuery.isLoading ||
        employeesQuery.isLoading ||
        (mode === "edit" && projectQuery.isLoading);

    const hasLookupError = managersQuery.isError || employeesQuery.isError;
    const hasProjectError = mode === "edit" && projectQuery.isError;

    useEffect(() => {
        if (hasLookupError) {
            setApiError(
                mode === "edit"
                    ? "Failed to load form data. Please retry."
                    : "Failed to load dropdown data. Please retry."
            );
        } else if (hasProjectError) {
            setApiError("Failed to load project data. Please retry.");
        } else {
            setApiError("");
        }
    }, [hasLookupError, hasProjectError, mode]);

    // ── Retry / refetch support ───────────────────────────────────────────────

    const reloadData = async () => {
        setApiError("");

        const tasks: Array<Promise<unknown>> = [
            managersQuery.refetch(),
            employeesQuery.refetch(),
        ];

        if (mode === "edit" && projectId) {
            tasks.push(projectQuery.refetch());
        }

        await Promise.all(tasks);
    };

    // ── Form submission ──────────────────────────────────────────────────────

    const submission = async (data: ProjectFormValues) => {
        if (mode === "edit" && !projectId) {
            setApiError("Project id is missing.");
            return;
        }

        setApiError("");
        setIsSubmitting(true);

        try {
            const payload = formToPayload(data);

            if (mode === "edit") {
                await updateProject(projectId, payload);
            } else {
                await createProject(payload);
            }

            navigate("/");
        } catch (err) {
            console.error(
                mode === "edit" ? "PUT project failed:" : "POST project failed:",
                err
            );
            setApiError(getApiErrorMessage(err, "Request failed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        ...form,
        submission,
        reloadData,
        projectManagers,
        employees,
        loading,
        apiError,
        isSubmitting,
    };
}