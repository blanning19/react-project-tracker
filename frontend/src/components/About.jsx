// About.jsx
import { Container, Card, Row, Col, Badge, ListGroup } from "react-bootstrap";

const About = () => {
    const stack = ["React (Vite)", "React Router", "React Hook Form + Yup", "React Bootstrap", "Django + Django REST Framework", "PostgreSQL", "JWT Auth (SimpleJWT)"];
    const features = [
        { title: "Project lifecycle tracking", body: "Create, edit, and manage projects with names, dates, comments, and status." },
        { title: "Team assignment", body: "Assign a project manager and select multiple employees for each project." },
        { title: "Validation + clean UX", body: "Client-side form validation (Yup) with server-side API validation for consistent data." },
        { title: "Secure API access", body: "JWT-based authentication for protected routes and API calls." },
        { title: "Scalable API design", body: "REST endpoints with paginated list responses and detail endpoints for CRUD." },
    ];
    const tips = [
        "If dropdowns are empty, verify lookup endpoints return results and the UI is reading the paginated .results array.",
        "Dates should be sent as YYYY-MM-DD strings; the forms use native date inputs to keep the format consistent.",
        "If you see a 400 response, check the response body for field-level validation messages from the API.",
    ];

    return (
        <Container className="py-4">
            <div className="page-header px-3 py-2 mb-3 border rounded d-flex align-items-center justify-content-between">
                <strong>About Project Tracker</strong>
                <div className="d-flex gap-2">
                    <Badge bg="secondary">React</Badge>
                    <Badge bg="secondary">Django REST</Badge>
                    <Badge bg="secondary">Postgres</Badge>
                </div>
            </div>

            <Row className="g-4">
                <Col lg={8}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title className="mb-2">What this app does</Card.Title>
                            <Card.Text className="text-muted mb-4">
                                Project Tracker is a lightweight, practical way to keep projects organized—who owns them, who’s assigned, what status they’re in, and the timeline they’re targeting.
                                It’s built as a modern React frontend backed by a Django REST API with a PostgreSQL database.
                            </Card.Text>

                            <Row className="g-3">
                                {features.map((f) => (
                                    <Col md={6} key={f.title}>
                                        <Card className="h-100 shadow-sm">
                                            <Card.Body>
                                                <div className="fw-semibold mb-1">{f.title}</div>
                                                <div>{f.body}</div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Card.Title className="mb-3">Tech stack</Card.Title>
                            <ListGroup variant="flush">
                                {stack.map((s) => <ListGroup.Item key={s} className="px-0">{s}</ListGroup.Item>)}
                            </ListGroup>
                        </Card.Body>
                    </Card>


                </Col>
            </Row>

            <Card className="shadow-sm mt-4">
                <Card.Body className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                    <div>
                        <div className="fw-semibold">Data model at a glance</div>
                        <div className="text-muted">Projects reference one project manager and can include many employees, with status and date fields for scheduling and reporting.</div>
                    </div>
                    <div className="text-muted small">
                        Tip: Keep your lookup lists (Project Managers, Employees) populated so forms can render assignments quickly.
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default About;