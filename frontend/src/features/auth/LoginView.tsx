import { type FormEvent } from "react";
import { Alert, Button, Card, Container, Form, Spinner } from "react-bootstrap";

/**
 * Props use change handler functions instead of raw setState dispatchers.
 *
 * Passing setState setters directly couples the view to the controller's
 * internal state type. Handler functions keep the interface stable if the
 * controller ever moves from useState to useReducer, and they match the
 * pattern used by every other view in the app.
 */
interface LoginViewProps {
    username: string;
    password: string;
    error: string;
    isSubmitting: boolean;
    onUsernameChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export default function LoginView({
    username,
    password,
    error,
    isSubmitting,
    onUsernameChange,
    onPasswordChange,
    onSubmit,
}: LoginViewProps) {
    return (
        <Container style={{ maxWidth: 420 }} className="py-5">
            <Card className="shadow-sm border">
                <Card.Body className="p-4">
                    <h4 className="mb-1 fw-semibold">Sign in</h4>
                    <p className="text-body-secondary small mb-4">
                        Enter your credentials to continue.
                    </p>

                    {error && (
                        <Alert variant="danger" className="py-2 px-3 small">
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={onSubmit}>
                        <Form.Group className="mb-3" controlId="login-username">
                            <Form.Label className="small fw-medium">Username</Form.Label>
                            <Form.Control
                                type="text"
                                value={username}
                                onChange={(e) => onUsernameChange(e.target.value)}
                                autoComplete="username"
                                autoFocus
                                disabled={isSubmitting}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="login-password">
                            <Form.Label className="small fw-medium">Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => onPasswordChange(e.target.value)}
                                autoComplete="current-password"
                                disabled={isSubmitting}
                            />
                        </Form.Group>

                        <Button
                            type="submit"
                            variant="dark"
                            className="w-100 d-flex align-items-center justify-content-center gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Spinner size="sm" />}
                            {isSubmitting ? "Signing in…" : "Sign in"}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}
