import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate, useParams } from "react-router-dom";
import {
    getEmployees,
    getProject,
    getProjectManagers,
    updateProject,
} from "../models/project.api";
import type { PersonOption, ProjectFormValues } from "../models/project.types";
import {
    DEFAULT_VALUES,
    formToPayload,
    PROJECT_SCHEMA,
    projectToFormValues,
} from "../shared/projectFormConfig";
import { getApiErrorMessage } from "../shared/getApiErrorMessage";

/**
 * Controller hook for the Edit feature.
 *
 * Responsibilities:
 * - read the project id from the route
 * - load lookup data and the existing project record
 * - populate the form with current values
 * - submit project updates to the backend
 * - expose loading and API error state to the view
 */
export function useEditController() {
    /**
     * Project id taken from the route parameter.
     * Defaults to an empty string to keep downstream calls typed consistently.
     */
    const { id: projectId = "" } = useParams();

    /**
     * Lookup list used by the project manager select field.
     */
    const [projectManagers, setProjectManagers] = useState<PersonOption[]>([]);

    /**
     * Lookup list used by the employees multi-select field.
     */
    const [employees, setEmployees] = useState<PersonOption[]>([]);

    /**
     * Indicates whether the page is still loading initial edit data.
     */
    const [loading, setLoading] = useState(true);

    /**
     * Indicates whether the update request is currently in flight.
     * This is used to disable the submit button and prevent duplicate submits.
     */
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Human-readable API error shown near the top of the form.
     */
    const [apiError, setApiError] = useState("");

    const navigate = useNavigate();

    /**
     * React Hook Form instance for the edit form.
     *
     * The form starts with shared defaults and is later populated with the
     * existing project data returned by the API.
     */
    const form = useForm<ProjectFormValues>({
        defaultValues: DEFAULT_VALUES,
        resolver: yupResolver(PROJECT_SCHEMA),
    });

    const { reset } = form;

    /**
     * Loads all data required by the edit page:
     * - project manager lookup list
     * - employee lookup list
     * - current project record
     *
     * After the data is loaded, the existing project is transformed into
     * form field values and pushed into React Hook Form.
     */
    const reloadData = useCallback(async () => {
        if (!projectId) {
            setApiError("Project id is missing.");
            setLoading(false);
            return;
        }

        setApiError("");
        setLoading(true);

        try {
            const [projectManagerData, employeeData, projectData] = await Promise.all([
                getProjectManagers(),
                getEmployees(),
                getProject(projectId),
            ]);

            setProjectManagers(projectManagerData);
            setEmployees(employeeData);
            reset(projectToFormValues(projectData));
        } catch (err) {
            console.error(
                "Edit getData failed:",
                (err as { response?: { status?: number; data?: unknown } })?.response?.status,
                (err as { response?: { data?: unknown } })?.response?.data ?? err
            );

            setApiError("Failed to load project data.");
        } finally {
            setLoading(false);
        }
    }, [projectId, reset]);

    useEffect(() => {
        void reloadData();
    }, [reloadData]);

    /**
     * Submits updated project values to the backend.
     *
     * Behavior:
     * - clears any previous API error
     * - transforms form values into API payload shape
     * - updates the existing project
     * - navigates back to the home page on success
     * - extracts validation/server error details on failure
     */
    const submission = async (data: ProjectFormValues) => {
        if (!projectId) {
            setApiError("Project id is missing.");
            return;
        }

        setApiError("");
        setIsSubmitting(true);

        try {
            await updateProject(projectId, formToPayload(data));
            navigate("/");
        } catch (err) {
            console.error("PUT project failed:", err);
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