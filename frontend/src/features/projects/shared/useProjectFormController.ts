/**
 * @file Shared controller hook for the Create and Edit project pages.
 *
 * @module projects/shared/useProjectFormController
 */

import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { useNavigate } from "react-router-dom";

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

import { getApiErrorMessage } from "./getApiErrorMessage";
import {
    DEFAULT_VALUES,
    formToPayload,
    PROJECT_SCHEMA,
    projectToFormValues,
} from "./projectFormConfig";

export type ProjectFormMode = "create" | "edit";

/**
 * Arguments accepted by {@link useProjectFormController}.
 */
export interface UseProjectFormControllerArgs {
    /** Whether the form is creating a new project or editing an existing one. */
    mode: ProjectFormMode;
    /**
     * String route param from `useParams`. Required (and non-empty) when
     * `mode` is `"edit"`. Ignored for `"create"`.
     */
    projectId?: string;
}

/**
 * Shared controller hook for the Create and Edit project form pages.
 *
 * Encapsulates all data-fetching, form wiring, and submit logic so that
 * `useCreateController` and `useEditController` remain thin wrappers that
 * only differ in the `mode` argument they pass down.
 *
 * ### Data fetching
 * Lookup data (managers, employees) and the edit record are fetched with
 * React Query so they can be cached, deduplicated, and explicitly refetched
 * when the user clicks Retry.
 *
 * ### Submit behaviour
 * Create and Edit share one mutation wrapper. The mutation function
 * chooses `createProject` vs `updateProject` based on `mode`. On success the
 * project list cache is invalidated and the user is navigated to `/` with a
 * router-state success message for the Home page banner.
 *
 * ### Why the `yupResolver` cast
 * `yupResolver` infers a broader generic than React Hook Form expects.
 * Casting through `unknown as Resolver<ProjectFormValues>` is safe at runtime
 * and avoids propagating the mismatch into call sites.
 *
 * @param args - See {@link UseProjectFormControllerArgs}.
 * @returns React Hook Form fields, lookup data, submission handler, loading
 *   state, and a `reloadData` callback for the Retry button.
 */
export function useProjectFormController({ mode, projectId = "" }: UseProjectFormControllerArgs) {
    const [apiError, setApiError] = useState("");
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const form = useForm<ProjectFormValues>({
        defaultValues: DEFAULT_VALUES,
        // Cast required: yupResolver generic resolution does not match RHF's
        // Resolver<ProjectFormValues> exactly. Safe at runtime.
        resolver: yupResolver(PROJECT_SCHEMA) as unknown as Resolver<ProjectFormValues>,
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

    /**
     * Query-load errors are derived from current query state rather than copied
     * into local state through an effect. This avoids redundant state syncing
     * and the extra render triggered by calling setState inside useEffect.
     *
     * `apiError` state remains reserved for user-triggered flows such as
     * submit failures or explicit reload attempts.
     */
    const derivedLoadError =
        hasLookupError
            ? mode === "edit"
                ? "Failed to load form data. Please retry."
                : "Failed to load dropdown data. Please retry."
            : hasProjectError
                ? "Failed to load project data. Please retry."
                : "";

    const effectiveApiError = apiError || derivedLoadError;

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
            await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

            if (mode === "edit" && projectId) {
                await queryClient.invalidateQueries({
                    queryKey: projectKeys.detail(projectId),
                });
            }

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
        try {
            await submitMutation.mutateAsync(data);
        } catch {
            // Error already handled in onError above — suppress the re-throw
        }
    };

    return {
        ...form,
        submission,
        reloadData,
        managers,
        employees,
        loading,
        apiError: effectiveApiError,
        isSubmitting: submitMutation.isPending,
    };
}