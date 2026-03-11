/**
 * @file Login page wiring component.
 *
 * @module auth/Login
 */

import LoginView from "./LoginView";
import { useLoginController } from "./useLoginController";

/**
 * Wires {@link useLoginController} to {@link LoginView}.
 *
 * Stays intentionally thin: no logic, no state — just controller → view
 * composition following the same pattern as every other feature page.
 *
 * @returns The rendered Login page.
 */
export default function Login() {
    const controller = useLoginController();
    return <LoginView {...controller} />;
}
