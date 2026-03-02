import { useEffect, useState } from "react";
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

    const { setValue } = form;

    useEffect(() => {
        /**
         * Loads all data required by the edit page:
         * - project manager lookup list
         * - employee lookup list
         * - current project record
         *
         * After the data is loaded, the existing project is transformed into
         * form field values and pushed into React Hook Form.
         */
        const getData = async () => {
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

                const formValues = projectToFormValues(projectData);

                Object.entries(formValues).forEach(([key, value]) => {
                    setValue(key as keyof ProjectFormValues, value, {
                        shouldValidate: false,
                        shouldDirty: false,
                    });
                });
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
        };

        if (projectId) {
            void getData();
        }
    }, [projectId, setValue]);

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
        setApiError("");

        try {
            await updateProject(projectId, formToPayload(data));
            navigate("/");
        } catch (err) {
            const status =
                (err as { response?: { status?: number }; status?: number })?.response?.status ??
                (err as { status?: number })?.status;

            const body =
                (err as {
                    response?: { data?: Record<string, string[]> };
                    data?: Record<string, string[]>;
                })?.response?.data ??
                (err as { data?: Record<string, string[]> })?.data;

            console.error("PUT project failed:", status, body ?? err);

            if (body && typeof body === "object") {
                setApiError(Object.values(body).flat().join(" ") || "Validation error.");
            } else if (status) {
                setApiError(`Request failed (${status}).`);
            } else {
                setApiError("An unexpected error occurred.");
            }
        }
    };

    return {
        ...form,
        submission,
        projectManagers,
        employees,
        loading,
        apiError,
    };
}