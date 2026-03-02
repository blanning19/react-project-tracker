import { Alert, Button, Card, Container, Spinner } from "react-bootstrap";
import type { NavigateFunction } from "react-router-dom";
import type { ProjectRecord } from "../models/project.types";

interface DeleteViewProps {
    data: ProjectRecord | null;
    loading: boolean;
    apiError: string;
    navigate: NavigateFunction;
    submission: () => Promise<void>;
}

const DeleteView = ({ data, loading, apiError, navigate, submission }: DeleteViewProps) => (
    <Container className="py-4">
        <div className="page-header px-3 py-2 mb-3 border rounded"><strong>Delete Project</strong></div>
        {apiError && <Alert variant="danger" className="fw-bold">{apiError}</Alert>}
        {loading ? <div className="d-flex align-items-center gap-2"><Spinner animation="border" size="sm" /><span>Loading data...</span></div> : !data ? <div className="text-muted">Project not found.</div> : <Card className="shadow-sm"><Card.Body><div className="mb-4">Are you sure you want to delete this project: <strong>{data.name}</strong>?</div><div className="d-flex gap-2"><Button variant="danger" onClick={submission}>Delete the project</Button><Button variant="outline-secondary" onClick={() => navigate("/")}>Cancel</Button></div></Card.Body></Card>}
    </Container>
);

export default DeleteView;
