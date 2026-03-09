import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import * as yup from "yup";
import { useCreateController } from "../features/projects/create/useCreateController";
import * as projectApi from "../features/projects/models/project.api";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock("../features/projects/models/project.api", () => ({
    createProject: vi.fn(),
    getEmployees: vi.fn(),
    getManagers: vi.fn(),
    getProject: vi.fn(),
    projectKeys: {
        all: () => ["projects"],
        lists: () => ["projects", "list"],
        list: (p: unknown) => ["projects", "list", p],
        detail: (id: unknown) => ["projects", "detail", String(id)],
    },
    lookupKeys: {
        managers: () => ["lookups", "managers"],
        employees: () => ["lookups", "employees"],
    },
}));

vi.mock("../features/projects/shared/projectFormConfig", () => ({
    DEFAULT_VALUES: {
        name: "",
        comments: "",
        status: "",
        managerId: "",
        employees: [],
        start_date: "",
        end_date: "",
        security_level: "Internal",
    },
    PROJECT_SCHEMA: yup.object({
        name: yup.string().required(),
        comments: yup.string().default(""),
        status: yup.string().required(),
        managerId: yup.mixed().required(),
        employees: yup.array().default([]),
        start_date: yup.string().default(""),
        end_date: yup.string().default(""),
        security_level: yup.string().required(),
    }),
    formToPayload: vi.fn((data) => ({
        ...data,
        transformed: true,
    })),
    projectToFormValues: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useCreateController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("loads lookup data on mount", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([
            { id: 1, first_name: "Alice", last_name: "Manager" },
        ]);
        mockedGetEmployees.mockResolvedValue([
            { id: 10, first_name: "Bob", last_name: "Employee" },
        ]);

        const { result } = renderHook(() => useCreateController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockedGetManagers).toHaveBeenCalledTimes(1);
        expect(mockedGetEmployees).toHaveBeenCalledTimes(1);
        expect(result.current.managers).toHaveLength(1);
        expect(result.current.employees).toHaveLength(1);
        expect(result.current.apiError).toBe("");
    });

    test("sets an api error when lookup loading fails", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            mockedGetManagers.mockRejectedValue(new Error("lookup load failed"));
            mockedGetEmployees.mockResolvedValue([]);

            const { result } = renderHook(() => useCreateController(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.apiError).toBe("Failed to load dropdown data. Please retry.");
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    test("submits new project data and navigates home on success", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedCreateProject = projectApi.createProject as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedCreateProject.mockResolvedValue({ id: 42 });

        const { result } = renderHook(() => useCreateController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.submission({
                name: "New Project",
                comments: "New project comments",
                status: "Open",
                managerId: "2",
                employees: ["10"],
                start_date: "2026-03-01",
                end_date: "2026-03-20",
                security_level: "Restricted",
            });
        });

        expect(mockedCreateProject).toHaveBeenCalledTimes(1);
        expect(mockedCreateProject).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "New Project",
                transformed: true,
                security_level: "Restricted",
            })
        );
        expect(mockNavigate).toHaveBeenCalledWith("/");
        expect(result.current.apiError).toBe("");
    });

    test("shows a status-based error when create fails without validation body", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedCreateProject = projectApi.createProject as ReturnType<typeof vi.fn>;
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            mockedGetManagers.mockResolvedValue([]);
            mockedGetEmployees.mockResolvedValue([]);
            mockedCreateProject.mockRejectedValue({
                response: { status: 500 },
            });

            const { result } = renderHook(() => useCreateController(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await expect(
                    result.current.submission({
                        name: "New Project",
                        comments: "",
                        status: "Open",
                        managerId: "1",
                        employees: [],
                        start_date: "",
                        end_date: "",
                        security_level: "Internal",
                    })
                ).rejects.toEqual(
                    expect.objectContaining({
                        response: { status: 500 },
                    })
                );
            });

            await waitFor(() => {
                expect(result.current.apiError).toBe("Request failed (500).");
            });

            expect(mockNavigate).not.toHaveBeenCalled();
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    test("reloadData refetches lookup queries in create mode", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);

        const { result } = renderHook(() => useCreateController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockedGetManagers).toHaveBeenCalledTimes(1);
        expect(mockedGetEmployees).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.reloadData();
        });

        await waitFor(() => {
            expect(mockedGetManagers).toHaveBeenCalledTimes(2);
            expect(mockedGetEmployees).toHaveBeenCalledTimes(2);
        });
    });
});