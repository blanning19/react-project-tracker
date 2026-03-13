/**
 * @file Shared presentational component for the Create and Edit project pages.
 *
 * @module projects/shared/ProjectFormPageView
 */

import type { Control, FieldErrors, UseFormHandleSubmit } from "react-hook-form";
import { Link } from "react-router-dom";

import type {
    EmployeeOption,
    ManagerOption,
    PersonOption,
    ProjectFormValues,
} from "../models/project.types";
import { STATUS_OPTIONS } from "../shared/projectFormConfig";
import ProjectFormFields from "../shared/ProjectFormFields";

import styles from "./ProjectFormPageView.module.css";

/**
 * Props for {@link ProjectFormPageView}.
 *
 * `managers` and `employees` are typed as `PersonOption[]` here because the
 * controller hooks (`useCreateController`, `useEditController`) return
 * `PersonOption[]` from `getManagers()` / `getEmployees()`. The concrete
 * subtypes (`ManagerOption[]` / `EmployeeOption[]`) are enforced by the casts
 * at the `ProjectFormFields` call site below.
 */
export interface ProjectFormPageViewProps {
    title: string;
    submitLabel: string;
    submittingLabel: string;
    control: Control<ProjectFormValues>;
    errors: FieldErrors<ProjectFormValues>;
    handleSubmit: UseFormHandleSubmit<ProjectFormValues>;
    submission: (data: ProjectFormValues) => Promise<void>;
    managers?: PersonOption[];
    employees: PersonOption[];
    loading: boolean;
    apiError: string;
    isSubmitting: boolean;
    onRetry?: () => Promise<void> | void;
}

function ProjectFormPageView({
    title,
    submitLabel,
    submittingLabel,
    control,
    errors,
    handleSubmit,
    submission,
    managers,
    employees,
    loading,
    apiError,
    isSubmitting,
    onRetry,
}: ProjectFormPageViewProps): JSX.Element {
    return (
        <div className="p-4">
            <div className="mb-4">
                <h1 className="mb-1">{title}</h1>
                <p className="text-body-secondary mb-0 fst-italic">
                    Fill out each section below, then save when ready.
                </p>
            </div>

            <div
                className="border rounded-4 p-4"
                style={{ backgroundColor: "#f6f1e8" }}
            >
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner} />
                        Loading form data…
                    </div>
                ) : (
                    <>
                        {apiError && (
                            <div className={styles.errorBanner}>
                                <span>{apiError}</span>
                                {onRetry && (
                                    <button
                                        type="button"
                                        className={styles.retryBtn}
                                        onClick={() => void onRetry()}
                                    >
                                        Retry
                                    </button>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(submission)}>
                            <div className={styles.card}>
                                <ProjectFormFields
                                    control={control}
                                    errors={errors}
                                    managers={managers as ManagerOption[] | undefined}
                                    employees={employees as EmployeeOption[]}
                                    statusOptions={STATUS_OPTIONS}
                                />
                            </div>

                            <div className={`${styles.footer} mt-4`}>
                                <Link to="/" className={styles.cancelBtn}>
                                    Cancel
                                </Link>

                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <span className={styles.submitSpinner} />}
                                    {isSubmitting ? submittingLabel : submitLabel}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProjectFormPageView;