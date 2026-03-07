import { Link } from "react-router-dom";
import type { Control, FieldErrors, UseFormHandleSubmit } from "react-hook-form";
import ProjectFormFields from "../shared/ProjectFormFields";
import { STATUS_OPTIONS } from "../shared/projectFormConfig";
import type { PersonOption, ProjectFormValues } from "../models/project.types";

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

const PFP_STYLES = `
    /* ── Light mode tokens ── */
    :root {
        --pfp-text:         #1a1a1a;
        --pfp-text-muted:   #999999;
        --pfp-bg-page:      #f5f2ee;
        --pfp-bg-card:      #ffffff;
        --pfp-border:       #e0dbd4;
        --pfp-border-head:  #1a1a1a;
        --pfp-footer-bg:    rgba(245,242,238,0.96);
        --pfp-btn-primary-bg:    #1a1a1a;
        --pfp-btn-primary-text:  #ffffff;
        --pfp-btn-cancel-border: #cccccc;
        --pfp-btn-cancel-text:   #666666;
        --pfp-btn-cancel-hover-border: #888888;
        --pfp-btn-cancel-hover-text:   #333333;
        --pfp-spinner-border: #dddddd;
        --pfp-spinner-top:    #1a1a1a;
        --pfp-error-bg:       #fdf2f2;
        --pfp-error-border:   #e8b4b4;
        --pfp-error-text:     #7a1a1a;
        --pfp-error-btn:      #c0392b;
    }

    /* ── Dark mode tokens ── */
    [data-bs-theme="dark"] {
        --pfp-text:         #e8e4df;
        --pfp-text-muted:   #666666;
        --pfp-bg-page:      #141414;
        --pfp-bg-card:      #1e1e1e;
        --pfp-border:       #2e2e2e;
        --pfp-border-head:  #e8e4df;
        --pfp-footer-bg:    rgba(20,20,20,0.96);
        --pfp-btn-primary-bg:    #e8e4df;
        --pfp-btn-primary-text:  #1a1a1a;
        --pfp-btn-cancel-border: #3a3a3a;
        --pfp-btn-cancel-text:   #888888;
        --pfp-btn-cancel-hover-border: #666666;
        --pfp-btn-cancel-hover-text:   #cccccc;
        --pfp-spinner-border: #333333;
        --pfp-spinner-top:    #e8e4df;
        --pfp-error-bg:       #2a1a1a;
        --pfp-error-border:   #5a2a2a;
        --pfp-error-text:     #e57373;
        --pfp-error-btn:      #e57373;
    }

    .pfp-page {
        font-family: 'Georgia', 'Times New Roman', serif;
        max-width: 880px;
        margin: 0 auto;
        padding: 40px 24px 120px;
        background: var(--pfp-bg-page);
        min-height: 100vh;
        transition: background 0.2s;
    }

    /* ── Page header ── */
    .pfp-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        border-bottom: 2px solid var(--pfp-border-head);
        padding-bottom: 20px;
        margin-bottom: 32px;
        transition: border-color 0.2s;
    }
    .pfp-title {
        font-size: 24px;
        font-weight: 700;
        color: var(--pfp-text);
        letter-spacing: -0.02em;
        line-height: 1.2;
    }
    .pfp-subtitle {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 13px;
        color: var(--pfp-text-muted);
        margin-top: 4px;
        font-style: italic;
    }

    /* ── Loading state ── */
    .pfp-loading {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 60px 0;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 14px;
        color: var(--pfp-text-muted);
    }
    .pfp-spinner {
        width: 18px;
        height: 18px;
        border: 2px solid var(--pfp-spinner-border);
        border-top-color: var(--pfp-spinner-top);
        border-radius: 50%;
        animation: pfp-spin 0.7s linear infinite;
        flex-shrink: 0;
        transition: border-color 0.2s;
    }
    @keyframes pfp-spin { to { transform: rotate(360deg); } }

    /* ── Error banner ── */
    .pfp-error-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        background: var(--pfp-error-bg);
        border: 1.5px solid var(--pfp-error-border);
        border-radius: 7px;
        padding: 12px 16px;
        margin-bottom: 24px;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 13.5px;
        color: var(--pfp-error-text);
        transition: background 0.2s, border-color 0.2s;
    }
    .pfp-retry-btn {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 12px;
        font-weight: 600;
        padding: 5px 14px;
        background: none;
        border: 1.5px solid var(--pfp-error-btn);
        border-radius: 5px;
        color: var(--pfp-error-btn);
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: background 0.15s, color 0.15s;
    }
    .pfp-retry-btn:hover {
        background: var(--pfp-error-btn);
        color: #fff;
    }

    /* ── Form card ── */
    .pfp-card {
        background: var(--pfp-bg-card);
        border-radius: 10px;
        border: 1px solid var(--pfp-border);
        padding: 0 36px;
        transition: background 0.2s, border-color 0.2s;
    }

    /* ── Sticky footer ── */
    .pfp-footer {
        position: sticky;
        bottom: 0;
        background: var(--pfp-footer-bg);
        backdrop-filter: blur(6px);
        border-top: 1px solid var(--pfp-border);
        padding: 14px 0;
        margin-top: 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        transition: background 0.2s, border-color 0.2s;
    }
    .pfp-cancel-btn {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 13.5px;
        padding: 9px 22px;
        background: none;
        border: 1.5px solid var(--pfp-btn-cancel-border);
        border-radius: 6px;
        color: var(--pfp-btn-cancel-text);
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        transition: border-color 0.15s, color 0.15s;
    }
    .pfp-cancel-btn:hover {
        border-color: var(--pfp-btn-cancel-hover-border);
        color: var(--pfp-btn-cancel-hover-text);
    }
    .pfp-submit-btn {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 13.5px;
        font-weight: 600;
        padding: 9px 26px;
        background: var(--pfp-btn-primary-bg);
        border: 1.5px solid var(--pfp-btn-primary-bg);
        border-radius: 6px;
        color: var(--pfp-btn-primary-text);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: opacity 0.15s, background 0.2s, color 0.2s;
    }
    .pfp-submit-btn:hover:not(:disabled) { opacity: 0.82; }
    .pfp-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .pfp-submit-spinner {
        width: 13px;
        height: 13px;
        border: 2px solid rgba(255,255,255,0.35);
        border-top-color: var(--pfp-btn-primary-text);
        border-radius: 50%;
        animation: pfp-spin 0.7s linear infinite;
    }

    @media (max-width: 620px) {
        .pfp-page { padding: 24px 16px 100px; }
        .pfp-card { padding: 0 16px; }
        .pfp-header { flex-direction: column; align-items: flex-start; gap: 12px; }
    }
`;

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
        <>
            <style>{PFP_STYLES}</style>

            <div className="pfp-page">

                <div className="pfp-header">
                    <div>
                        <div className="pfp-title">{title}</div>
                        <div className="pfp-subtitle">
                            Fill out each section below, then save when ready.
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="pfp-loading">
                        <div className="pfp-spinner" />
                        Loading form data…
                    </div>
                ) : (
                    <>
                        {apiError && (
                            <div className="pfp-error-banner">
                                <span>{apiError}</span>
                                {onRetry && (
                                    <button
                                        type="button"
                                        className="pfp-retry-btn"
                                        onClick={() => void onRetry()}
                                    >
                                        Retry
                                    </button>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(submission)}>
                            <div className="pfp-card">
                                <ProjectFormFields
                                    control={control}
                                    errors={errors}
                                    projectManagers={projectManagers}
                                    employees={employees}
                                    statusOptions={STATUS_OPTIONS}
                                />
                            </div>

                            <div className="pfp-footer">
                                <Link to="/" className="pfp-cancel-btn">
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    className="pfp-submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <span className="pfp-submit-spinner" />}
                                    {isSubmitting ? submittingLabel : submitLabel}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </>
    );
}

export default ProjectFormPageView;
