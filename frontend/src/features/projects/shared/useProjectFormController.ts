import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import {
    createProject,
    getEmployees,
    getProject,
    getProjectManagers,
    updateProject,
} from "../models/project.api";
import type { PersonOption, ProjectFormValues, ProjectRecord } from "../models/project.types";
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
 * This hook centralizes:
 * - React Hook Form initialization and validation
 * - lookup data loading (project managers, employees)
 * - create/update submission behavior
 * - consistent loading, submitting, and API error state
 *
 * Create wrapper: `useProjectFormController({ mode: "create" })`
 * Edit wrapper:   `useProjectFormController({ mode: "edit", projectId })`
 */
export function useProjectFormController({ mode, projectId = "" }: UseProjectFormControllerArgs) {
    /**
     * Lookup list used by the project manager select field.
     */
    const [projectManagers, setProjectManagers] = useState<PersonOption[]>([]);

    /**
     * Lookup list used by the employees multi-select field.
     */
    const [employees, setEmployees] = useState<PersonOption[]>([]);

    /**
     * Indicates whether the page is still loading initial data.
     */
    const [loading, setLoading] = useState(true);

    /**
     * Indicates whether the create/update request is currently in flight.
     * Used to disable submit to prevent double submits.
     */
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Human-readable API error shown near the top of the form.
     */
    const [apiError, setApiError] = useState("");

    const navigate = useNavigate();

    /**
     * React Hook Form instance for the project form.
     *
     * Create and Edit share defaults + schema so behavior stays consistent.
     */
    const form = useForm<ProjectFormValues>({
        defaultValues: DEFAULT_VALUES,
        resolver: yupResolver(PROJECT_SCHEMA),
    });

    const { reset } = form;

    /**
     * Loads all data required by the form:
     * - lookup lists (project managers, employees)
     * - when editing, the existing project record to populate defaults
     */
    const reloadData = useCallback(async () => {
        if (mode === "edit" && !projectId) {
            setApiError("Project id is missing.");
            setLoading(false);
            return;
        }

        setApiError("");
        setLoading(true);

        try {
            const promises: Array<Promise<unknown>> = [getProjectManagers(), getEmployees()];

            if (mode === "edit") promises.push(getProject(projectId));

            const results = await Promise.all(promises);

            const projectManagerData = results[0] as PersonOption[];
            const employeeData = results[1] as PersonOption[];

            setProjectManagers(projectManagerData);
            setEmployees(employeeData);

            if (mode === "edit") {
                const projectData = results[2] as ProjectRecord;
                reset(projectToFormValues(projectData));
            }
        } catch (err) {
            console.error(
                "Project form reloadData failed:",
                (err as { response?: { status?: number; data?: unknown } })?.response?.status,
                (err as { response?: { data?: unknown } })?.response?.data ?? err
            );

            setApiError(mode === "edit" ? "Failed to load project data." : "Failed to load dropdown data.");
        } finally {
            setLoading(false);
        }
    }, [mode, projectId, reset]);

    useEffect(() => {
        void reloadData();
    }, [reloadData]);

    /**
     * Submits the form.
     *
     * Create:
     * - POST /projects
     *
     * Edit:
     * - PUT /projects/:id
     */
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
            console.error(mode === "edit" ? "PUT project failed:" : "POST projects failed:", err);
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
