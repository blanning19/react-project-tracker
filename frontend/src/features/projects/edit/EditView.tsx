import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import type { Control, FieldErrors, UseFormHandleSubmit } from "react-hook-form";
import ProjectFormFields from "../shared/ProjectFormFields";
import { STATUS_OPTIONS } from "../shared/projectFormConfig";
import type { PersonOption, ProjectFormValues } from "../models/project.types";

interface EditViewProps {
    control: Control<ProjectFormValues>;
    errors: FieldErrors<ProjectFormValues>;
    handleSubmit: UseFormHandleSubmit<ProjectFormValues>;
    submission: (data: ProjectFormValues) => Promise<void>;
    projectManagers: PersonOption[];
    employees: PersonOption[];
    loading: boolean;
    apiError: string;
}

const EditView = ({ control, errors, handleSubmit, submission, projectManagers, employees, loading, apiError }: EditViewProps) => {
    if (loading) return <p>Loading data...</p>;

    return (
        <Container className="py-4">
            <div className="page-header px-3 py-2 mb-3 border rounded"><strong>Edit records</strong></div>
            <Card className="shadow-sm">
                <Card.Body>
                    {apiError && <Alert variant="danger" className="fw-bold">{apiError}</Alert>}
                    <Form onSubmit={handleSubmit(submission)}>
                        <ProjectFormFields control={control} errors={errors} projectmanager={projectManagers} employees={employees} statusOptions={STATUS_OPTIONS} />
                        <div className="d-flex justify-content-end"><Button type="submit" variant="primary" style={{ width: "30%" }}>Submit</Button></div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EditView;
