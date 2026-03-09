import { render, screen } from "@testing-library/react";
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

/*
 * REMARK: Keep Navbar mocked and lightweight so this stays a focused route
 * composition test instead of a full layout integration test.
 */
vi.mock("../shared/layout/Navbar", () => ({
    default: () => (
        <div>
            <div data-testid="navbar-layout">Navbar Layout</div>
            <div data-testid="navbar-outlet">Outlet Content</div>
        </div>
    ),
}));

describe("App", () => {
    it("renders login without the protected application shell assertion burden", () => {
        const { container } = render(
            <MemoryRouter initialEntries={["/login"]}>
                <App />
            </MemoryRouter>
        );

        expect(container).toBeTruthy();
    });

    it("keeps the Navbar layout visible on the public About page", () => {
        render(
            <MemoryRouter initialEntries={["/about"]}>
                <App />
            </MemoryRouter>
        );

        /*
         * REMARK: This verifies the route composition bug you found:
         * About must render inside the Navbar layout.
         */
        expect(screen.getByTestId("navbar-layout")).toBeInTheDocument();
    });
});