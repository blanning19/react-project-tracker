import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../App";

vi.mock("../shared/auth/AuthProvider", () => ({
    useAuth: () => ({
        accessToken: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        handleSessionExpired: vi.fn(),
    }),
}));

vi.mock("../shared/layout/Navbar", () => ({
    default: () => <div data-testid="navbar-layout">Navbar Layout</div>,
}));

describe("App", () => {
    it("renders without crashing", () => {
        const { container } = render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );

        expect(container).toBeTruthy();
    });
});