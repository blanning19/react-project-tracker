/**
 * @file Presentational component for the Login page.
 *
 * @module auth/LoginView
 */

import { type FormEvent } from "react";
import { Alert, Button, Card, Container, Form, Spinner } from "react-bootstrap";

/**
 * Props for {@link LoginView}.
 *
 * Change handler functions are used instead of raw `setState` dispatchers so
 * the view is decoupled from the controller's internal state type. This keeps
 * the interface stable if the controller migrates from `useState` to
 * `useReducer`, and it matches the handler pattern used by every other view
 * in the app.
 */
export interface LoginViewProps {
    /** Current value of the username field. */
    username: string;
    /** Current value of the password field. */
    password: string;
    /** User-facing error message. Renders as a dismissible alert when non-empty. */
    error: string;
    /** Disables inputs and shows a spinner while the login request is in-flight. */
    isSubmitting: boolean;
    /** Called with the new username string on every keystroke. */
    onUsernameChange: (value: string) => void;
    /** Called with the new password string on every keystroke. */
    onPasswordChange: (value: string) => void;
    /** Called on form submission. Responsible for calling `event.preventDefault`. */
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * Presentational (view) component for the Login page.
 *
 * Renders a centred card with username, password, and submit controls.
 * All state and submission logic lives in `useLoginController` —
 * this component is intentionally free of side effects.
 *
 * Accessibility notes:
 * - Error message rendered as a Bootstrap `Alert` with `role="alert"` semantics.
 * - Inputs are disabled during submission to prevent double-submit.
 * - `autoFocus` on the username field for keyboard users.
 */
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
