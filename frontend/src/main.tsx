import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { registerSessionExpiredHandler } from "./shared/http/fetchClient";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

/**
 * Register the global session-expired handler before the app renders.
 *
 * When a 401 is received and token refresh fails anywhere in the app,
 * fetchClient calls this handler to redirect the user to /login.
 *
 * Why window.location.replace instead of React Router navigate():
 * - navigate() only works inside React components and hooks.
 * - fetchClient is a plain module with no access to the React tree.
 * - window.location.replace() performs a hard redirect that also clears
 *   browser history, preventing the user from pressing Back to return
 *   to a page that will immediately fail again with no session.
 *
 * The hard redirect also resets all in-memory React state cleanly,
 * which is the safest behavior after a session has fully expired.
 */
registerSessionExpiredHandler(() => {
    window.location.replace("/login");
});

const container = document.getElementById("root");

if (!container) {
    throw new Error("Root element #root not found. Check your index.html.");
}

createRoot(container).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>
);
