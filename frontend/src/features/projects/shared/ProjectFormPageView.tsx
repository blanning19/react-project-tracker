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
 * Shared Create/Edit form page.
 *
 * UI goals:
 * - clean, scannable sections using cards
 * - consistent error presentation
 * - sticky footer actions so Save is always accessible
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
            <div className="d-flex flex-column gap-1 mb-3">
                <h1 className="h3 mb-0">{title}</h1>
                <div className="text-body-secondary">
                    Fill out the sections below and click <strong>Save project</strong> when ready.
                </div>
            </div>

            {apiError ? (
                <Alert
                    variant="danger"
                    className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2"
                >
                    <div className="fw-semibold">{apiError}</div>

                    {onRetry ? (
                        <Button variant="outline-danger" size="sm" onClick={() => void onRetry()}>
                            Retry
                        </Button>
                    ) : null}
                </Alert>
            ) : null}

            <Form onSubmit={handleSubmit(submission)}>
                <ProjectFormFields
                    control={control}
                    errors={errors}
                    projectManagers={projectManagers}
                    employees={employees}
                    statusOptions={STATUS_OPTIONS}
                />

                {/* Sticky action bar keeps primary actions available after long sections (like Employees). */}
                <div className="position-sticky bottom-0 pt-3 pb-3 bg-body">
                    <Card className="shadow-sm">
                        <Card.Body className="d-flex justify-content-between align-items-center gap-2">
                            <Button as={Link} to="/" variant="outline-secondary" disabled={isSubmitting}>
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
                        </Card.Body>
                    </Card>
                </div>
            </Form>
        </Container>
    );
}

export default ProjectFormPageView;