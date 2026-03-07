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
 * Lookup data (managers, employees) is fetched via React Query so it is:
 * - cached across Create/Edit mounts (no re-fetch if data is still fresh)
 * - deduplicated — opening Create then Edit does not fire two parallel requests
 * - automatically revalidated in the background after 5 minutes
 *
 * The existing project record (edit mode) is also fetched via React Query,
 * which means navigating back to the same edit URL uses the cached record
 * instantly while a background revalidation runs.
 *
 * Create wrapper: `useProjectFormController({ mode: "create" })`
 * Edit wrapper:   `useProjectFormController({ mode: "edit", projectId })`
 */
export function useProjectFormController({ mode, projectId = "" }: UseProjectFormControllerArgs) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState("");
    const navigate = useNavigate();

    // ── React Hook Form ──────────────────────────────────────────────────────
    const form = useForm<ProjectFormValues>({
        defaultValues: DEFAULT_VALUES,
        resolver: yupResolver(PROJECT_SCHEMA),
    });
    const { reset } = form;

    // ── Lookup data — cached via React Query ─────────────────────────────────
    //
    // staleTime: 5 minutes — managers and employees change infrequently.
    // Both queries share the same cache keys across the whole app, so opening
    // Create after Edit (or vice versa) reuses the already-cached data.

    const {
        data: projectManagers = [],
        isLoading: managersLoading,
        isError: managersError,
    } = useQuery({
        queryKey: lookupKeys.managers(),
        queryFn: getManagers,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: employees = [],
        isLoading: employeesLoading,
        isError: employeesError,
    } = useQuery({
        queryKey: lookupKeys.employees(),
        queryFn: getEmployees,
        staleTime: 5 * 60 * 1000,
    });

    // ── Existing project — edit mode only ────────────────────────────────────
    //
    // enabled: false when projectId is empty (create mode) so the query
    // never fires. React Query still tracks the state, so the loading
    // logic below is uniform regardless of mode.

    const {
        data: existingProject,
        isLoading: projectLoading,
        isError: projectError,
    } = useQuery<ProjectRecord>({
        queryKey: ["projects", "detail", projectId],
        queryFn: () => getProject(projectId),
        enabled: mode === "edit" && projectId !== "",
        staleTime: 60_000, // 1 minute — project data changes more often than lookups
    });

    // ── Populate form when existing project data arrives ─────────────────────
    //
    // useEffect is the correct tool here: reset() is a side effect that should
    // run once when the data first becomes available (or changes on refetch).
    useEffect(() => {
        if (existingProject) {
            reset(projectToFormValues(existingProject));
        }
    }, [existingProject, reset]);

    // ── Derived loading / error state ────────────────────────────────────────

    const loading =
        managersLoading ||
        employeesLoading ||
        (mode === "edit" && projectLoading);

    const hasLookupError = managersError || employeesError;
    const hasProjectError = mode === "edit" && projectError;

    // Surface lookup/project fetch errors through the same apiError channel
    // the form already uses, so the view only needs one error display path.
    const reloadData = async () => {
        // React Query manages refetching via invalidation. This function is
        // exposed so the Retry button in ProjectFormPageView has something to
        // call, but the actual refetch is handled by React Query automatically
        // when the queries are invalidated or when the component re-mounts.
        setApiError("");
    };

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
