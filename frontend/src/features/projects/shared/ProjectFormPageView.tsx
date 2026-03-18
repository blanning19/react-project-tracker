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
        <div className="dashboard-page container-fluid px-3 px-lg-4 py-4">
            <div className="dashboard-shell mx-auto">
                <section className="dashboard-hero mb-4">
                    <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-lg-between gap-3">
                        <div>
                            <div className="dashboard-eyebrow">Projects</div>

                            <h1 className="dashboard-title mb-2">{title}</h1>

                            <p className="dashboard-subtitle mb-0">
                                Fill out each section below, then save when ready.
                            </p>
                        </div>

                        <Link to="/" className="dashboard-action-link text-decoration-none">
                            Back to projects
                        </Link>
                    </div>
                </section>

                <section className="dashboard-card">
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner} />
                            Loading form data...
                        </div>
                    ) : (
                        <>
                            {apiError && (
                                <div className={`${styles.errorBanner} mb-4`}>
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
                </section>
            </div>
        </div>
    );
}

export default ProjectFormPageView;