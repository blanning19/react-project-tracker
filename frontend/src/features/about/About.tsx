import { Badge, Card, Col, Container, ListGroup, Row } from "react-bootstrap";

/**
 * Describes one feature shown in the About page feature grid.
 */
type FeatureItem = {
    icon: string;
    title: string;
    body: string;
};

/**
 * Props for the reusable feature card component.
 */
type FeatureCardProps = {
    icon: string;
    title: string;
    body: string;
};

/**
 * Props for the reusable tech stack card component.
 */
type TechStackCardProps = {
    items: string[];
};

/**
 * Props for the reusable highlights card component.
 */
type HighlightsCardProps = {
    items: string[];
};

/**
 * Static technology list displayed in the right-side "Tech stack" card.
 *
 * Keeping this data outside the component prevents the array from being rebuilt
 * on every render and keeps the page component focused on layout.
 */
const STACK_ITEMS: string[] = [
    "React (Vite)",
    "React Router",
    "React Hook Form + Yup",
    "React Bootstrap",
    "Django + Django REST Framework",
    "PostgreSQL",
    "JWT authentication (SimpleJWT)",
];

/**
 * Static feature definitions rendered as a responsive grid of cards.
 *
 * Each item represents one user-facing capability of the app.
 */
const FEATURE_ITEMS: FeatureItem[] = [
    {
        icon: "📁",
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
        body: "Use client-side and server-side validation together to keep project data clean and consistent.",
    },
    {
        icon: "🔒",
        title: "Secure API access",
        body: "Protect routes and backend requests with JWT-based authentication.",
    },
    {
        icon: "🔎",
        title: "Search, sorting, and filtering",
        body: "Quickly find projects and organize the list view with search, status filtering, sorting, and pagination.",
    },
    {
        icon: "📱",
        title: "Responsive user experience",
        body: "Use a table layout on larger screens and a card-based layout on smaller screens for better readability.",
    },
];

/**
 * Short summary bullets displayed in the right-side highlights card.
 *
 * These provide a quick business-level summary for users who do not need the
 * full technical breakdown.
 */
const HIGHLIGHT_ITEMS: string[] = [
    "Track ownership, assignments, and project status in one place.",
    "Keep project data organized with clear validation and structured forms.",
    "Support both desktop and mobile-friendly views for daily use.",
];

/**
 * Polished hero-style header for the About page.
 *
 * This creates a stronger visual entry point than a simple title row while
 * still staying lightweight and consistent with Bootstrap styling.
 */
function AboutHero(): JSX.Element {
    return (
        <Card className="shadow-sm border-0 mb-4 bg-body-tertiary">
            <Card.Body className="p-4">
                <Row className="g-4 align-items-center">
                    <Col lg={8}>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            <Badge bg="dark">Project Tracker</Badge>
                            <Badge bg="secondary">React</Badge>
                            <Badge bg="secondary">Django REST</Badge>
                            <Badge bg="secondary">PostgreSQL</Badge>
                        </div>

                        <h1 className="h3 mb-2">Organize projects with a cleaner, more practical workflow.</h1>

                        <p className="text-body-secondary mb-0">
                            Project Tracker helps teams manage project ownership, assignments, status, and scheduling
                            in one structured interface backed by a modern full-stack architecture.
                        </p>
                    </Col>

                    <Col lg={4}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body>
                                <div className="fw-semibold mb-3">Quick snapshot</div>

                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex justify-content-between">
                                        <span className="text-body-secondary">Frontend</span>
                                        <span className="fw-semibold">React + Vite</span>
                                    </div>

                                    <div className="d-flex justify-content-between">
                                        <span className="text-body-secondary">Backend</span>
                                        <span className="fw-semibold">Django REST</span>
                                    </div>

                                    <div className="d-flex justify-content-between">
                                        <span className="text-body-secondary">Database</span>
                                        <span className="fw-semibold">PostgreSQL</span>
                                    </div>

                                    <div className="d-flex justify-content-between">
                                        <span className="text-body-secondary">Auth</span>
                                        <span className="fw-semibold">JWT</span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}

/**
 * Reusable card used to display one feature in the feature grid.
 *
 * Typing the props makes the expected data shape explicit and helps catch
 * mistakes when the component is reused elsewhere.
 */
function FeatureCard({ icon, title, body }: FeatureCardProps): JSX.Element {
    return (
        <Card className="h-100 shadow-sm border-0">
            <Card.Body>
                <div className="d-flex align-items-start gap-3">
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-body-tertiary"
                        style={{ width: 44, height: 44, fontSize: 20 }}
                    >
                        <span aria-hidden="true">{icon}</span>
                    </div>

                    <div>
                        <div className="fw-semibold mb-2">{title}</div>
                        <div className="text-body-secondary">{body}</div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

/**
 * Card that summarizes the application's technology stack.
 *
 * Accepting the list as props keeps the component reusable and easy to test.
 */
function TechStackCard({ items }: TechStackCardProps): JSX.Element {
    return (
        <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
                <Card.Title className="mb-3">Tech stack</Card.Title>

                <ListGroup variant="flush">
                    {items.map((item) => (
                        <ListGroup.Item key={item} className="px-0">
                            {item}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Card.Body>
        </Card>
    );
}

/**
 * Card that surfaces a few quick application highlights.
 *
 * This gives the right column a more balanced layout and helps summarize value
 * without requiring users to read the full feature list first.
 */
function HighlightsCard({ items }: HighlightsCardProps): JSX.Element {
    return (
        <Card className="shadow-sm border-0">
            <Card.Body>
                <Card.Title className="mb-3">Why it is useful</Card.Title>

                <ListGroup variant="flush">
                    {items.map((item) => (
                        <ListGroup.Item key={item} className="px-0">
                            {item}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Card.Body>
        </Card>
    );
}

/**
 * Section introducing the feature grid.
 *
 * Keeping this as a small reusable block improves readability in the main page
 * component and makes the layout easier to scan.
 */
function SectionIntro({
    eyebrow,
    title,
    body,
}: {
    eyebrow: string;
    title: string;
    body: string;
}): JSX.Element {
    return (
        <div className="mb-3">
            <div className="text-uppercase small fw-semibold text-body-secondary mb-1">{eyebrow}</div>
            <div className="h5 mb-2">{title}</div>
            <div className="text-body-secondary">{body}</div>
        </div>
    );
}

/**
 * Bottom summary card that explains the core project relationship model.
 *
 * This gives the user a quick mental model of how project managers and
 * employees relate to projects without requiring backend knowledge.
 */
function DataModelSummaryCard(): JSX.Element {
    return (
        <Card className="shadow-sm border-0 mt-4">
            <Card.Body className="p-4">
                <Row className="g-4 align-items-start">
                    <Col lg={8}>
                        <div className="text-uppercase small fw-semibold text-body-secondary mb-1">Data model</div>
                        <div className="h5 mb-2">How project data is organized</div>
                        <div className="text-body-secondary">
                            Each project stores a name, comments, status, start date, end date, one assigned project
                            manager, and any number of employee assignments.
                        </div>
                    </Col>

                    <Col lg={4}>
                        <Card className="border-0 bg-body-tertiary">
                            <Card.Body className="p-3">
                                <div className="fw-semibold mb-2">Helpful tip</div>
                                <div className="small text-body-secondary">
                                    Keep your employee and project manager lookup data populated so project forms stay
                                    fast and easy to use.
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}

/**
 * About page for the Project Tracker application.
 *
 * Responsibilities:
 * - explain what the application does
 * - highlight major user-facing features
 * - summarize the technology stack
 * - provide a simple data model overview
 */
function About(): JSX.Element {
    return (
        <Container className="py-4">
            <AboutHero />

            <Row className="g-4">
                <Col lg={8}>
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-4">
                            <SectionIntro
                                eyebrow="Overview"
                                title="What this app does"
                                body="Project Tracker is a lightweight application for organizing projects, tracking ownership, assigning team members, and monitoring status over time."
                            />

                            <Row className="g-3">
                                {FEATURE_ITEMS.map((feature) => (
                                    <Col md={6} key={feature.title}>
                                        <FeatureCard icon={feature.icon} title={feature.title} body={feature.body} />
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <TechStackCard items={STACK_ITEMS} />
                    <HighlightsCard items={HIGHLIGHT_ITEMS} />
                </Col>
            </Row>

            <DataModelSummaryCard />
        </Container>
    );
}

export default About;