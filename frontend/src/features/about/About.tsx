import { Badge, Card, Col, Container, ListGroup, Row } from "react-bootstrap";

type FeatureItem = {
    icon: string;
    title: string;
    body: string;
};

const STACK_ITEMS: string[] = [
    "React 18 + Vite",
    "React Router v6",
    "React Hook Form + Yup",
    "React Bootstrap 5",
    "Django 6 + Django REST Framework",
    "PostgreSQL",
    "JWT authentication (SimpleJWT)",
    "TypeScript",
];

const FEATURE_ITEMS: FeatureItem[] = [
    {
        icon: "📋",
        title: "Project lifecycle tracking",
        body: "Create, update, and manage projects with names, comments, status, and target dates.",
    },
    {
        icon: "👥",
        title: "Team assignment",
        body: "Assign one project manager and attach multiple employees to each project record.",
    },
    {
        icon: "✅",
        title: "Reliable validation",
        body: "Client-side and server-side validation work together to keep project data clean and consistent.",
    },
    {
        icon: "🔒",
        title: "Secure API access",
        body: "All routes and backend requests are protected with JWT-based authentication and token rotation.",
    },
    {
        icon: "🔎",
        title: "Search, sorting, and filtering",
        body: "Find projects quickly with name search, status filtering, sortable columns, and pagination.",
    },
    {
        icon: "📱",
        title: "Responsive layout",
        body: "Table layout on larger screens, card-based layout on mobile for comfortable daily use.",
    },
];

const HIGHLIGHT_ITEMS: string[] = [
    "Track ownership, assignments, and project status in one place.",
    "Keep project data organized with clear validation and structured forms.",
    "Supports both desktop and mobile-friendly views for daily use.",
    "Production-hardened with token blacklisting, rate limiting, and HTTPS security headers.",
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AboutHero(): JSX.Element {
    return (
        <div className="rounded border bg-body-tertiary p-4 mb-4">
            <Row className="g-4 align-items-center">
                <Col lg={8}>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        <Badge bg="dark">Project Tracker</Badge>
                        <Badge bg="secondary">React</Badge>
                        <Badge bg="secondary">Django REST</Badge>
                        <Badge bg="secondary">PostgreSQL</Badge>
                        <Badge bg="secondary">JWT</Badge>
                    </div>

                    <h1 className="h3 fw-bold mb-2">
                        Organize projects with a cleaner, more practical workflow.
                    </h1>

                    <p className="text-body-secondary mb-0">
                        Project Tracker helps teams manage project ownership, assignments, status,
                        and scheduling in one structured interface backed by a modern full-stack
                        architecture.
                    </p>
                </Col>

                <Col lg={4}>
                    <Card className="border shadow-sm">
                        <Card.Body>
                            <div className="fw-semibold mb-3">Quick snapshot</div>
                            {[
                                { label: "Frontend",  value: "React + Vite + TypeScript" },
                                { label: "Backend",   value: "Django REST Framework" },
                                { label: "Database",  value: "PostgreSQL" },
                                { label: "Auth",      value: "JWT + token rotation" },
                            ].map(({ label, value }) => (
                                <div key={label} className="d-flex justify-content-between py-1 border-bottom last-border-0">
                                    <span className="text-body-secondary small">{label}</span>
                                    <span className="fw-semibold small text-end">{value}</span>
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

function FeatureCard({ icon, title, body }: FeatureItem): JSX.Element {
    return (
        <Card className="h-100 border shadow-sm">
            <Card.Body>
                <div className="d-flex align-items-start gap-3">
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-body-tertiary"
                        style={{ width: 44, height: 44, fontSize: 20 }}
                        aria-hidden="true"
                    >
                        {icon}
                    </div>

                    <div>
                        <div className="fw-semibold mb-1">{title}</div>
                        <div className="text-body-secondary small">{body}</div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

function DataModelCard(): JSX.Element {
    return (
        <Card className="border shadow-sm mt-4">
            <Card.Body className="p-4">
                <Row className="g-4 align-items-start">
                    <Col lg={8}>
                        <div className="text-uppercase small fw-semibold text-body-secondary mb-1">
                            Data model
                        </div>
                        <div className="h5 mb-2">How project data is organized</div>
                        <div className="text-body-secondary">
                            Each project stores a name, comments, status, security level, start
                            date, end date, one assigned project manager, and any number of
                            employee assignments. Project managers and employees are managed
                            independently and assigned to projects via dropdown selectors.
                        </div>
                    </Col>

                    <Col lg={4}>
                        <Card className="border-0 bg-body-tertiary">
                            <Card.Body className="p-3">
                                <div className="fw-semibold mb-2 small">Relationships</div>
                                <ul className="mb-0 ps-3 small text-body-secondary">
                                    <li className="mb-1">Project → ProjectManager (many-to-one)</li>
                                    <li className="mb-1">Project → Employees (many-to-many)</li>
                                    <li>Deleting a manager sets the field to blank, not delete the project</li>
                                </ul>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function About(): JSX.Element {
    return (
        <Container className="py-4">
            <AboutHero />

            <Row className="g-4">
                {/* Left: feature grid */}
                <Col lg={8}>
                    <Card className="border shadow-sm h-100">
                        <Card.Body className="p-4">
                            <div className="text-uppercase small fw-semibold text-body-secondary mb-1">
                                Features
                            </div>
                            <div className="h5 mb-1">What this app does</div>
                            <div className="text-body-secondary mb-4">
                                A lightweight tool for organizing projects, tracking ownership,
                                assigning team members, and monitoring status over time.
                            </div>

                            <Row className="g-3">
                                {FEATURE_ITEMS.map((feature) => (
                                    <Col md={6} key={feature.title}>
                                        <FeatureCard {...feature} />
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right: tech stack + highlights */}
                <Col lg={4}>
                    <Card className="border shadow-sm mb-4">
                        <Card.Body>
                            <div className="fw-semibold mb-3">Tech stack</div>
                            <ListGroup variant="flush">
                                {STACK_ITEMS.map((item) => (
                                    <ListGroup.Item key={item} className="px-0 py-2 small">
                                        {item}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>

                    <Card className="border shadow-sm">
                        <Card.Body>
                            <div className="fw-semibold mb-3">Why it is useful</div>
                            <ListGroup variant="flush">
                                {HIGHLIGHT_ITEMS.map((item) => (
                                    <ListGroup.Item key={item} className="px-0 py-2 small text-body-secondary">
                                        {item}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <DataModelCard />
        </Container>
    );
}

export default About;
