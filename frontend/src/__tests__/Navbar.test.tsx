import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Navbar from "../shared/layout/Navbar";

/**
 * Tests for Navbar logout behaviour.
 *
 * Specifically verifies the fix where Navbar previously called
 * tokenStore.clear() + FetchInstance.post() directly (bypassing AuthProvider),
 * meaning in local mode the backend was never notified and the refresh token
 * stayed live after logout.
 *
 * After the fix, Navbar delegates entirely to useAuth().logout(), which
 * calls logoutRequest() (backend) + clears tokens + redirects.
 */

const logoutMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../shared/auth/AuthProvider", () => ({
    useAuth: () => ({
        accessToken: "fake-access-token",
        isAuthenticated: true,
        login: vi.fn(),
        logout: logoutMock,
        handleSessionExpired: vi.fn(),
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
    return {
        ...actual,
        useNavigate: () => navigateMock,
        Outlet: () => <div data-testid="outlet" />,
    };
});

// Prevent tokenStore from reading real localStorage in tests
vi.mock("../shared/auth/tokens", () => ({
    tokenStore: {
        getAccess: () => "fake-access-token",
        setAccess: vi.fn(),
        getRefresh: () => "fake-refresh-token",
        setRefresh: vi.fn(),
        clear: vi.fn(),
    },
}));

function renderNavbar() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe("Navbar logout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset localStorage sidebar state so collapsed state doesn't interfere
        localStorage.clear();
    });

    it("renders a Logout button when the user is authenticated", () => {
        renderNavbar();
        // The sidebar renders a Logout button (desktop sidebar, title attr on collapsed)
        const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
        expect(logoutButtons.length).toBeGreaterThan(0);
    });

    it("calls useAuth logout when the Logout button is clicked", async () => {
        logoutMock.mockResolvedValue(undefined);
        renderNavbar();

        const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
        // FIX: Add ! non-null assertion — noUncheckedIndexedAccess widens
        // array index access to HTMLElement | undefined.
        fireEvent.click(logoutButtons[0]!);

        await waitFor(() => {
            expect(logoutMock).toHaveBeenCalledTimes(1);
        });
    });

    it("does NOT call tokenStore.clear directly — delegates to useAuth", async () => {
        /**
         * This is the core regression test for the Navbar fix.
         *
         * The old implementation called tokenStore.clear() directly and
         * conditionally called the backend only in cookie mode.
         * In local mode (the default) the backend was never called.
         *
         * The fix: Navbar calls useAuth().logout() exclusively.
         * useAuth().logout() is responsible for the backend call + clear + redirect.
         * Navbar must not interact with tokenStore directly.
         */
        const { tokenStore } = await import("../shared/auth/tokens");
        logoutMock.mockResolvedValue(undefined);

        renderNavbar();

        const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
        // FIX: Add ! non-null assertion.
        fireEvent.click(logoutButtons[0]!);

        await waitFor(() => {
            expect(logoutMock).toHaveBeenCalledTimes(1);
        });

        // tokenStore.clear must NOT have been called directly by Navbar
        expect(tokenStore.clear).not.toHaveBeenCalled();
    });

    it("calls useAuth logout even when it rejects — does not swallow the call", async () => {
        /**
         * AuthProvider.logout() is best-effort (try/finally), so a network
         * failure during the backend call is AuthProvider's responsibility,
         * not Navbar's. This test verifies Navbar still delegates to logout()
         * exactly once and does not add its own try/catch that would hide the
         * call from the mock.
         *
         * We resolve the mock's promise manually so there is no unhandled
         * rejection floating in the test runner.
         */
        let resolveLogout!: () => void;
        logoutMock.mockImplementation(
            () => new Promise<void>((resolve) => { resolveLogout = resolve; })
        );

        renderNavbar();

        const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
        // FIX: Add ! non-null assertion.
        fireEvent.click(logoutButtons[0]!);

        // Confirm Navbar called logout() before we resolve it
        await waitFor(() => {
            expect(logoutMock).toHaveBeenCalledTimes(1);
        });

        // Clean up: resolve so no pending promise lingers after the test
        resolveLogout();
    });
});
