import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { useLoginController } from "../features/auth/useLoginController";
import FetchInstance from "../shared/http/fetchClient";

const mockNavigate = vi.fn();
const mockLocation = { state: null, pathname: "/login" };

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
}));

vi.mock("../shared/http/fetchClient", () => ({
    default: {
        post: vi.fn(),
    },
}));

vi.mock("../shared/auth/tokens", () => ({
    tokenStore: {
        setAccess: vi.fn(),
        setRefresh: vi.fn(),
        getAccess: vi.fn(() => null),
        getRefresh: vi.fn(() => null),
        clear: vi.fn(),
    },
}));

vi.mock("../shared/auth/mode", () => ({
    isCookieAuth: false,
}));

const mockedPost = FetchInstance.post as ReturnType<typeof vi.fn>;

describe("useLoginController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocation.state = null;
    });

    // ── Initial state ────────────────────────────────────────────────────────

    test("initialises with empty fields and no error", () => {
        const { result } = renderHook(() => useLoginController());
        expect(result.current.username).toBe("");
        expect(result.current.password).toBe("");
        expect(result.current.error).toBe("");
        expect(result.current.isSubmitting).toBe(false);
    });

    // ── Field change handlers ────────────────────────────────────────────────

    test("onUsernameChange updates username", () => {
        const { result } = renderHook(() => useLoginController());
        act(() => {
            result.current.onUsernameChange("alice");
        });
        expect(result.current.username).toBe("alice");
    });

    test("onPasswordChange updates password", () => {
        const { result } = renderHook(() => useLoginController());
        act(() => {
            result.current.onPasswordChange("secret");
        });
        expect(result.current.password).toBe("secret");
    });

    // ── Successful login ─────────────────────────────────────────────────────

    test("navigates to / on successful login with no prior location state", async () => {
        mockedPost.mockResolvedValue({ data: { access: "access-token", refresh: "refresh-token" } });

        const { result } = renderHook(() => useLoginController());

        act(() => {
            result.current.onUsernameChange("alice");
            result.current.onPasswordChange("password1");
        });

        await act(async () => {
            await result.current.onSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(mockedPost).toHaveBeenCalledWith("auth/login/", { username: "alice", password: "password1" });
        expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
        expect(result.current.error).toBe("");
        expect(result.current.isSubmitting).toBe(false);
    });

    test("navigates to the prior route when location.state.from is set", async () => {
        (mockLocation as typeof mockLocation & { state: unknown }).state = {
            from: { pathname: "/projects/42/edit" },
        };
        mockedPost.mockResolvedValue({ data: { access: "token", refresh: "refresh" } });

        const { result } = renderHook(() => useLoginController());

        await act(async () => {
            await result.current.onSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(mockNavigate).toHaveBeenCalledWith("/projects/42/edit", { replace: true });
    });

    test("clears any previous error before submitting", async () => {
        // First call fails, second succeeds — error should be gone after second submit.
        mockedPost
            .mockRejectedValueOnce({ status: 401 })
            .mockResolvedValueOnce({ data: { access: "token" } });

        const { result } = renderHook(() => useLoginController());

        // First submit — produces an error
        await act(async () => {
            await result.current.onSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });
        expect(result.current.error).toBe("Invalid username or password.");

        // Second submit — should clear the error before the request fires
        await act(async () => {
            await result.current.onSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });
        expect(result.current.error).toBe("");
    });

    // ── Error handling ───────────────────────────────────────────────────────

    test("sets credentials error message on 401 response", async () => {
        mockedPost.mockRejectedValue({ status: 401 });

        const { result } = renderHook(() => useLoginController());

        await act(async () => {
            await result.current.onSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.error).toBe("Invalid username or password.");
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("sets credentials error on 401 from err.response.status shape", async () => {
        mockedPost.mockRejectedValue({ response: { status: 401 } });

        const { result } = renderHook(() => useLoginController());

        await act(async () => {
            await result.current.onSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.error).toBe("Invalid username or password.");
    });

    test("sets network error message on non-401 failure", async () => {
        mockedPost.mockRejectedValue({ status: 500 });

        const { result } = renderHook(() => useLoginController());

        await act(async () => {
            await result.current.onSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.error).toBe("Could not connect. Please try again.");
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("sets network error message when error has no status at all", async () => {
        mockedPost.mockRejectedValue(new Error("Network failure"));

        const { result } = renderHook(() => useLoginController());

        await act(async () => {
            await result.current.onSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.error).toBe("Could not connect. Please try again.");
    });

    // ── isSubmitting flag ────────────────────────────────────────────────────

    test("resets isSubmitting to false after a successful login", async () => {
        mockedPost.mockResolvedValue({ data: { access: "token" } });

        const { result } = renderHook(() => useLoginController());

        await act(async () => {
            await result.current.onSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.isSubmitting).toBe(false);
    });

    test("resets isSubmitting to false after a failed login", async () => {
        mockedPost.mockRejectedValue({ status: 401 });

        const { result } = renderHook(() => useLoginController());

        await act(async () => {
            await result.current.onSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.isSubmitting).toBe(false);
    });
});
