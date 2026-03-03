import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { createProject, getEmployees, getProjectManagers } from "../models/project.api";
import type { PersonOption, ProjectFormValues } from "../models/project.types";
import { DEFAULT_VALUES, formToPayload, PROJECT_SCHEMA } from "../shared/projectFormConfig";
import { getApiErrorMessage } from "../shared/getApiErrorMessage";

/**
 * Controller hook for the Create feature.
 *
 * Responsibilities:
 * - initialize the project form
 * - load lookup data needed by the form
 * - submit a new project to the backend
 * - expose loading and error state to the view
 */
export function useCreateController() {
    /**
     * Lookup list used by the project manager select field.
     */
    const [projectManagers, setProjectManagers] = useState<PersonOption[]>([]);

    /**
     * Lookup list used by the employees multi-select field.
     */
    const [employees, setEmployees] = useState<PersonOption[]>([]);

    /**
     * Indicates whether the page is still loading initial dropdown data.
     */
    const [loading, setLoading] = useState(true);

    /**
     * Indicates whether the create request is currently in flight.
     * This is used to disable the submit button and prevent duplicate submits.
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
     * The form is initialized with shared default values and shared schema
     * validation so Create and Edit behave consistently.
     */
    const form = useForm<ProjectFormValues>({
        defaultValues: DEFAULT_VALUES,
        resolver: yupResolver(PROJECT_SCHEMA),
    });

    useEffect(() => {
        /**
         * Loads the lookup lists required to render the form fields.
         *
         * This includes:
         * - project managers
         * - employees
         */
        const getData = async () => {
            setApiError("");

            try {
                const [projectManagerData, employeeData] = await Promise.all([
                    getProjectManagers(),
                    getEmployees(),
                ]);

                setProjectManagers(projectManagerData);
                setEmployees(employeeData);
            } catch (err) {
                console.error(
                    "GET lookup data failed:",
                    (err as { response?: { status?: number; data?: unknown } })?.response?.status,
                    (err as { response?: { data?: unknown } })?.response?.data ?? err
                );

                setApiError("Failed to load dropdown data.");
            } finally {
                setLoading(false);
            }
        };

        void getData();
    }, []);

    /**
     * Submits the create form to the backend.
     *
     * Behavior:
     * - clears any previous API error
     * - transforms form values into API payload shape
     * - creates the project
     * - navigates back to the home page on success
     * - extracts and displays validation/server errors on failure
     */
    const submission = async (data: ProjectFormValues) => {
        setApiError("");
        setIsSubmitting(true);

        const payload = formToPayload(data);

        try {
            await createProject(payload);
            navigate("/");
        } catch (err) {
            console.error("POST projects failed:", err);
            setApiError(getApiErrorMessage(err, "Request failed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        ...form,
        submission,
        projectManagers,
        employees,
        loading,
        apiError,
        isSubmitting,
    };
}