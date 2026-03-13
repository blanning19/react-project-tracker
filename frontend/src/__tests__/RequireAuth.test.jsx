import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

import RequireAuth from "../features/auth/RequireAuth";

const mockUseAuth = vi.fn();

vi.mock("../shared/auth/AuthProvider", () => ({
    useAuth: () => mockUseAuth(),
}));

describe("RequireAuth", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("redirects to /login when no access token", () => {
        mockUseAuth.mockReturnValue({
            accessToken: null,
            isAuthenticated: false,
            login: vi.fn(),
            logout: vi.fn(),
            handleSessionExpired: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={["/protected"]}>
                <Routes>
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route element={<RequireAuth />}>
                        <Route path="/protected" element={<div>Protected Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Login Page")).toBeInTheDocument();
    });

    it("renders children when access token exists and is not expired", () => {
        const futureExp = Math.floor(Date.now() / 1000) + 60 * 60;
        const token = `header.${btoa(JSON.stringify({ exp: futureExp }))}.signature`;

        mockUseAuth.mockReturnValue({
            accessToken: token,
            isAuthenticated: true,
            login: vi.fn(),
            logout: vi.fn(),
            handleSessionExpired: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={["/protected"]}>
                <Routes>
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route element={<RequireAuth />}>
                        <Route path="/protected" element={<div>Protected Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("redirects to /login when token is expired", () => {
        const pastExp = Math.floor(Date.now() / 1000) - 60;

        mockUseAuth.mockReturnValue({
            accessToken: `header.${btoa(JSON.stringify({ exp: pastExp }))}.signature`,
            isAuthenticated: true,
            login: vi.fn(),
            logout: vi.fn(),
            handleSessionExpired: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={["/protected"]}>
                <Routes>
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route element={<RequireAuth />}>
                        <Route path="/protected" element={<div>Protected Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
});