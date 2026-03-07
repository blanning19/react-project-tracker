import { Link } from "react-router-dom";
import type { Control, FieldErrors, UseFormHandleSubmit } from "react-hook-form";
import ProjectFormFields from "../shared/ProjectFormFields";
import { STATUS_OPTIONS } from "../shared/projectFormConfig";
import type { PersonOption, ProjectFormValues } from "../models/project.types";
import styles from "./ProjectFormPageView.module.css";

interface ProjectFormPageViewProps {
    title: string;
    submitLabel: string;
    submittingLabel: string;
    control: Control<ProjectFormValues>;
    errors: FieldErrors<ProjectFormValues>;
    handleSubmit: UseFormHandleSubmit<ProjectFormValues>;
    submission: (data: ProjectFormValues) => Promise<void>;
    projectManagers: PersonOption[];
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
    projectManagers,
    employees,
    loading,
    apiError,
    isSubmitting,
    onRetry,
}: ProjectFormPageViewProps): JSX.Element {
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <div className={styles.title}>{title}</div>
                    <div className={styles.subtitle}>
                        Fill out each section below, then save when ready.
                    </div>
                </div>
            </div>

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
                                projectManagers={projectManagers}
                                employees={employees}
                                statusOptions={STATUS_OPTIONS}
                            />
                        </div>

                        <div className={styles.footer}>
                            <Link to="/" className={styles.cancelBtn}>
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && (
                                    <span className={styles.submitSpinner} />
                                )}
                                {isSubmitting ? submittingLabel : submitLabel}
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}

export default ProjectFormPageView;
