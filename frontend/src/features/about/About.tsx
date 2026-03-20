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

/**
 * Renders the hero section for the About page.
 *
 * @returns The rendered About hero section.
 */
function AboutHero(): JSX.Element
{
    return (
        <section className="dashboard-hero mb-4">
            <Row className="g-4 align-items-center">
                <Col lg={8}>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        <Badge bg="dark">Project Tracker</Badge>
                        <Badge bg="secondary">React</Badge>
                        <Badge bg="secondary">Django REST</Badge>
                        <Badge bg="secondary">PostgreSQL</Badge>
                        <Badge bg="secondary">JWT</Badge>
                    </div>

                    <div className="dashboard-eyebrow">About</div>

                    <h1 className="dashboard-title mb-2">
                        Organize projects with a cleaner, more practical workflow.
                    </h1>

                    <p className="dashboard-subtitle mb-0">
                        Project Tracker helps teams manage project ownership, assignments, status,
                        and scheduling in one structured interface backed by a modern full-stack
                        architecture.
                    </p>
                </Col>

                <Col lg={4}>
                    <div className="dashboard-updated-pill d-inline-flex">
                        Full-stack project management snapshot
                    </div>
                </Col>
            </Row>
        </section>
    );
}

/**
 * Renders a single feature card.
 *
 * @param props The feature item content.
 * @returns The rendered feature card.
 */
function FeatureCard({ icon, title, body }: FeatureItem): JSX.Element
{
    return (
        <Card className="dashboard-inner-card h-100">
            <Card.Body>
                <div className="d-flex align-items-start gap-3">
                    <div
                        className="about-icon-circle"
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

/**
 * Renders the data model summary card.
 *
 * @returns The rendered data model section.
 */
function DataModelCard(): JSX.Element
{
    return (
        <section className="dashboard-card mt-4">
            <Row className="g-4 align-items-start">
                <Col lg={8}>
                    <div className="dashboard-card-label">Data model</div>
                    <div className="h5 mb-2">How project data is organized</div>
                    <div className="dashboard-card-description">
                        Each project stores a name, comments, status, security level, start
                        date, end date, one assigned project manager, and any number of
                        employee assignments. Project managers and employees are managed
                        independently and assigned to projects via dropdown selectors.
                    </div>
                </Col>

                <Col lg={4}>
                    <Card className="dashboard-inner-card border-0">
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
        </section>
    );
}

/**
 * Renders the About page.
 *
 * @returns The rendered About page.
 */
function About(): JSX.Element
{
    return (
        <div className="dashboard-page container-fluid px-3 px-lg-4 py-4">
            <div className="dashboard-shell mx-auto">
                <AboutHero />

                <Row className="g-4">
                    <Col lg={8}>
                        <section className="dashboard-card h-100">
                            <div className="dashboard-card-header">
                                <div className="dashboard-card-label">Features</div>
                                <div className="h5 mb-1">What this app does</div>
                                <p className="dashboard-card-description mb-4">
                                    A lightweight tool for organizing projects, tracking ownership,
                                    assigning team members, and monitoring status over time.
                                </p>
                            </div>

                            <Row className="g-3">
                                {FEATURE_ITEMS.map((feature) => (
                                    <Col md={6} key={feature.title}>
                                        <FeatureCard {...feature} />
                                    </Col>
                                ))}
                            </Row>
                        </section>
                    </Col>

                    <Col lg={4}>
                        <section className="dashboard-card mb-4">
                            <div className="dashboard-card-header">
                                <div className="dashboard-card-label">Stack</div>
                                <div className="h5 mb-1">Tech stack</div>
                            </div>

                            <ListGroup variant="flush">
                                {STACK_ITEMS.map((item) => (
                                    <ListGroup.Item key={item} className="about-list-item px-0 py-2 small">
                                        {item}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </section>

                        <section className="dashboard-card">
                            <div className="dashboard-card-header">
                                <div className="dashboard-card-label">Highlights</div>
                                <div className="h5 mb-1">Why it is useful</div>
                            </div>


                        </section>
                    </Col>
                </Row>

                <DataModelCard />
            </div>
        </div>
    );
}

export default About;