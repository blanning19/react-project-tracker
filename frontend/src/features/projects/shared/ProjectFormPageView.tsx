/**
 * @file Shared presentational component for the Create and Edit project pages.
 *
 * @module projects/shared/ProjectFormPageView
 */

import { Link } from "react-router-dom";
import type { Control, FieldErrors, UseFormHandleSubmit } from "react-hook-form";
import ProjectFormFields from "../shared/ProjectFormFields";
import { STATUS_OPTIONS } from "../shared/projectFormConfig";
import type { PersonOption, ProjectFormValues } from "../models/project.types";
import styles from "./ProjectFormPageView.module.css";

/**
 * Props for {@link ProjectFormPageView}.
 *
 * All form-related props (`control`, `errors`, `handleSubmit`) are passed
 * directly from the controller hook, which spreads the React Hook Form return
 * value into the view.
 */
export interface ProjectFormPageViewProps {
    /** Page heading rendered as the form title (e.g. `"Create project"`). */
    title: string;
    /** Submit button label in idle state (e.g. `"Save"`). */
    submitLabel: string;
    /** Submit button label while the mutation is in-flight (e.g. `"Saving…"`). */
    submittingLabel: string;
    /** React Hook Form `control` object passed through to `ProjectFormFields`. */
    control: Control<ProjectFormValues>;
    /** React Hook Form field errors passed through to `ProjectFormFields`. */
    errors: FieldErrors<ProjectFormValues>;
    /** React Hook Form `handleSubmit` function used to wrap `submission`. */
    handleSubmit: UseFormHandleSubmit<ProjectFormValues>;
    /** Called with validated form data on successful submission. */
    submission: (data: ProjectFormValues) => Promise<void>;
    /** Manager options for the dropdown, loaded asynchronously. */
    managers?: PersonOption[];
    /** Employee options for the checkbox list, loaded asynchronously. */
    employees: PersonOption[];
    /** `true` while lookup data or the project record is loading. */
    loading: boolean;
    /** Non-empty when a fetch or submission error has occurred. */
    apiError: string;
    /** `true` while the create/update mutation is in-flight. */
    isSubmitting: boolean;
    /**
     * Optional callback for the "Retry" button shown alongside `apiError`.
     * Omit to hide the retry button.
     */
    onRetry?: () => Promise<void> | void;
}

/**
 * Shared presentational component for the Create and Edit project pages.
 *
 * Renders the page header, loading skeleton, error banner, form fields, and
 * submit/cancel footer. All logic lives in the controller hooks
 * (`useCreateController` / `useEditController`) — this component is
 * intentionally free of side effects.
 *
 * ### Layout
 * - Full-bleed cream background matching the Home page.
 * - Form fields are grouped in a bordered card.
 * - Cancel link navigates back to `/` without triggering a submission.
 */
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
                                managers={managers}
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
