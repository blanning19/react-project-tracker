import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLoginController } from "../features/auth/useLoginController";

const navigateMock = vi.fn();
const loginRequestMock = vi.fn();
const authLoginMock = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

vi.mock("../shared/auth/authApi", () => ({
    loginRequest: (...args: unknown[]) => loginRequestMock(...args),
}));

vi.mock("../shared/auth/AuthProvider", () => ({
    useAuth: () => ({
        accessToken: null,
        isAuthenticated: false,
        login: authLoginMock,
        logout: vi.fn(),
        handleSessionExpired: vi.fn(),
    }),
}));

function createWrapper(initialEntries: Array<string | { pathname: string; state?: unknown }> = ["/login"]) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path="/login" element={children} />
                </Routes>
            </MemoryRouter>
        );
    };
}

describe("useLoginController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("initialises with empty fields and no error", () => {
        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper(),
        });

        expect(result.current.username).toBe("");
        expect(result.current.password).toBe("");
        expect(result.current.error).toBe("");
        expect(result.current.isSubmitting).toBe(false);
    });

    it("onUsernameChange updates username", () => {
        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.onUsernameChange("brad");
        });

        expect(result.current.username).toBe("brad");
    });

    it("onPasswordChange updates password", () => {
        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.onPasswordChange("secret");
        });

        expect(result.current.password).toBe("secret");
    });

    it("navigates to / on successful login with no prior location state", async () => {
        loginRequestMock.mockResolvedValue({ access: "access-token", refresh: "refresh-token" });

        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.onUsernameChange("brad");
            result.current.onPasswordChange("secret");
        });

        await act(async () => {
            await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(loginRequestMock).toHaveBeenCalledWith("brad", "secret");
        expect(authLoginMock).toHaveBeenCalledWith({ access: "access-token", refresh: "refresh-token" });
        expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
    });

    it("navigates to the prior route when location.state.from is set", async () => {
        loginRequestMock.mockResolvedValue({ access: "access-token", refresh: "refresh-token" });

        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper([{ pathname: "/login", state: { from: { pathname: "/create" } } }]),
        });

        act(() => {
            result.current.onUsernameChange("brad");
            result.current.onPasswordChange("secret");
        });

        await act(async () => {
            await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(navigateMock).toHaveBeenCalledWith("/create", { replace: true });
    });

    it("clears any previous error before submitting", async () => {
        loginRequestMock.mockRejectedValue({ status: 401 });

        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.onUsernameChange("brad");
            result.current.onPasswordChange("bad-pass");
        });

        await act(async () => {
            await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.error).toBe("Invalid username or password.");

        loginRequestMock.mockResolvedValue({ access: "access-token", refresh: "refresh-token" });

        await act(async () => {
            await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.error).toBe("");
    });

    it("sets credentials error message on 401 response", async () => {
        loginRequestMock.mockRejectedValue({ status: 401 });

        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.error).toBe("Invalid username or password.");
    });

    it("sets credentials error on 401 from err.response.status shape", async () => {
        loginRequestMock.mockRejectedValue({ response: { status: 401 } });

        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.error).toBe("Invalid username or password.");
    });

    it("sets network error message on non-401 failure", async () => {
        loginRequestMock.mockRejectedValue({ status: 500 });

        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.error).toBe("Could not connect. Please try again.");
    });

    it("sets network error message when error has no status at all", async () => {
        loginRequestMock.mockRejectedValue(new Error("Network failure"));

        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.error).toBe("Could not connect. Please try again.");
    });

    it("resets isSubmitting to false after a successful login", async () => {
        loginRequestMock.mockResolvedValue({ access: "access-token", refresh: "refresh-token" });

        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.isSubmitting).toBe(false);
    });

    it("resets isSubmitting to false after a failed login", async () => {
        loginRequestMock.mockRejectedValue({ status: 401 });

        const { result } = renderHook(() => useLoginController(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await result.current.onSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.isSubmitting).toBe(false);
    });
});