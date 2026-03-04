import { Alert, Button, Card, Container, Form, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import type { Control, FieldErrors, UseFormHandleSubmit } from "react-hook-form";
import ProjectFormFields from "../shared/ProjectFormFields";
import { STATUS_OPTIONS } from "../shared/projectFormConfig";
import type { PersonOption, ProjectFormValues } from "../models/project.types";

/**
 * Props for the shared project form page view used by both Create and Edit.
 *
 * This component is intentionally presentation-focused. It receives all form
 * state, lookup lists, and submit behavior from the controller layer and only
 * concerns itself with rendering the UI.
 */
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

/**
 * Shared form page used by both the Create and Edit features.
 *
 * Responsibilities:
 * - render the page shell and form layout
 * - show loading and API error states
 * - render the shared project fields component
 * - wire the form submit handler to the supplied controller action
 *
 * This prevents duplicate view code across Create and Edit.
 */
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
    if (loading) {
        return (
            <Container className="py-4">
                <div className="d-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" />
                    <span>Loading form data...</span>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="page-header px-3 py-3 mb-3 border rounded bg-body-tertiary text-body">
                <div className="fs-4 fw-bold text-body">{title}</div>
                <div className="small text-body-secondary mt-1">
                    Complete the fields below and save your project changes.
                </div>
            </div>

            <Card className="shadow-sm">
                <Card.Body>
                    {apiError && (
                        <Alert variant="danger" className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
                            <div className="fw-bold">{apiError}</div>

                            {onRetry && (
                                <Button variant="outline-danger" size="sm" onClick={() => void onRetry()}>
                                    Retry
                                </Button>
                            )}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit(submission)}>
                        <ProjectFormFields
                            control={control}
                            errors={errors}
                            projectManagers={projectManagers}
                            employees={employees}
                            statusOptions={STATUS_OPTIONS}
                        />

                        {/* Keep secondary navigation on the left and the primary submit action on the right. */}
                        <div className="d-flex flex-column flex-sm-row justify-content-end align-items-stretch align-items-sm-center gap-2 pt-2">
                            <Button as={Link} to="/" variant="secondary">
                                Cancel
                            </Button>

                            <Button type="submit" variant="primary" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        {submittingLabel}
                                    </>
                                ) : (
                                    submitLabel
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default ProjectFormPageView;