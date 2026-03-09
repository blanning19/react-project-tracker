import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createProject,
    getEmployees,
    getProject,
    getManagers,
    lookupKeys,
    projectKeys,
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
 *
 * REMARK:
 * Submit behavior now uses React Query mutations instead of manual async state.
 * This centralizes pending state and cache invalidation in the data layer.
 */
export function useProjectFormController({ mode, projectId = "" }: UseProjectFormControllerArgs) {
    const [apiError, setApiError] = useState("");
    const navigate = useNavigate();

    // REMARK: Added queryClient so create/update can invalidate cached project lists.
    const queryClient = useQueryClient();

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
        queryKey: projectKeys.detail(projectId),
        queryFn: () => getProject(projectId),
        enabled: mode === "edit" && projectId !== "",
        staleTime: 60_000,
    });

    const managers = managersQuery.data ?? [];
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

    // ── Submit mutation ───────────────────────────────────────────────────────
    //
    // REMARK:
    // Create and Edit now share one mutation wrapper. The mutation function
    // chooses create vs update based on mode, while onSuccess handles cache
    // invalidation and navigation in one place.

    const submitMutation = useMutation({
        mutationFn: async (data: ProjectFormValues) => {
            if (mode === "edit" && !projectId) {
                throw new Error("Project id is missing.");
            }

            const payload = formToPayload(data);

            return mode === "edit"
                ? updateProject(projectId, payload)
                : createProject(payload);
        },

        onSuccess: async () => {
            // REMARK: Invalidate all project list queries so Home refreshes with the new data.
            await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

            // REMARK: If editing, also invalidate this specific detail cache entry.
            if (mode === "edit" && projectId) {
                await queryClient.invalidateQueries({
                    queryKey: projectKeys.detail(projectId),
                });
            }

            // Pass a success message through router state so HomeView can display
            // a confirmation banner. Using state avoids a global store and the
            // message is automatically discarded if the user navigates away and back.
            navigate("/", {
                state: {
                    successMessage:
                        mode === "edit"
                            ? "Project updated successfully."
                            : "Project created successfully.",
                },
            });
        },

        onError: (err) => {
            console.error(
                mode === "edit" ? "PUT project failed:" : "POST project failed:",
                err
            );
            setApiError(getApiErrorMessage(err, "Request failed"));
        },
    });

    // ── Form submission ──────────────────────────────────────────────────────

    const submission = async (data: ProjectFormValues) => {
        setApiError("");
        await submitMutation.mutateAsync(data);
    };

    return {
        ...form,
        submission,
        reloadData,
        managers,
        employees,
        loading,
        apiError,

        // REMARK: isSubmitting now comes from the React Query mutation pending state.
        isSubmitting: submitMutation.isPending,
    };
}