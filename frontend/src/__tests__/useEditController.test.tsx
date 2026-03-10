import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import * as yup from "yup";
import { useEditController } from "../features/projects/edit/useEditController";
import * as projectApi from "../features/projects/models/project.api";

const mockNavigate = vi.fn();
const mockUseParams = vi.fn();

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
}));

vi.mock("../features/projects/models/project.api", () => ({
    createProject: vi.fn(),
    getEmployees: vi.fn(),
    getManagers: vi.fn(),
    getProject: vi.fn(),
    updateProject: vi.fn(),
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
    projectToFormValues: vi.fn((project) => ({
        name: project.name,
        comments: project.comments ?? "",
        status: project.status ?? "",
        managerId: project.manager ? String(project.manager.id) : "",
        employees: (project.employees ?? []).map((e: { id: number }) => String(e.id)),
        start_date: project.start_date ?? "",
        end_date: project.end_date ?? "",
        security_level: project.security_level ?? "Internal",
    })),
}));

// A realistic existing project record as returned by GET /api/projects/:id/
const EXISTING_PROJECT = {
    id: 99,
    name: "Existing Project",
    comments: "Some notes",
    status: "Active",
    start_date: "2025-01-01",
    end_date: "2025-12-31",
    security_level: "Internal" as const,
    manager: { id: 3, name: "Alice Johnson" },
    employees: [
        { id: 10, first_name: "Bob", last_name: "Employee" },
        { id: 11, first_name: "Carol", last_name: "Staff" },
    ],
};

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

describe("useEditController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: valid project id in the route
        mockUseParams.mockReturnValue({ id: "99" });
    });

    test("loads lookup data and existing project on mount", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject = projectApi.getProject as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([{ id: 3, name: "Alice Johnson" }]);
        mockedGetEmployees.mockResolvedValue([
            { id: 10, first_name: "Bob", last_name: "Employee" },
        ]);
        mockedGetProject.mockResolvedValue(EXISTING_PROJECT);

        const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockedGetManagers).toHaveBeenCalledTimes(1);
        expect(mockedGetEmployees).toHaveBeenCalledTimes(1);
        expect(mockedGetProject).toHaveBeenCalledWith("99");
        expect(result.current.managers).toHaveLength(1);
        expect(result.current.employees).toHaveLength(1);
        expect(result.current.apiError).toBe("");
    });

    test("populates the form with existing project data", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject = projectApi.getProject as ReturnType<typeof vi.fn>;
        const { projectToFormValues } = await import(
            "../features/projects/shared/projectFormConfig"
        );

        mockedGetManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedGetProject.mockResolvedValue(EXISTING_PROJECT);

        const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // projectToFormValues should have been called with the fetched project
        expect(projectToFormValues).toHaveBeenCalledWith(EXISTING_PROJECT);

        // Form values should reflect the existing project
        expect(result.current.getValues("name")).toBe("Existing Project");
        expect(result.current.getValues("managerId")).toBe("3");
        expect(result.current.getValues("status")).toBe("Active");
        expect(result.current.getValues("employees")).toEqual(["10", "11"]);
    });

    test("calls updateProject (not createProject) on submit", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject = projectApi.getProject as ReturnType<typeof vi.fn>;
        const mockedUpdateProject = projectApi.updateProject as ReturnType<typeof vi.fn>;
        const mockedCreateProject = projectApi.createProject as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedGetProject.mockResolvedValue(EXISTING_PROJECT);
        mockedUpdateProject.mockResolvedValue({ ...EXISTING_PROJECT, name: "Updated Project" });

        const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.submission({
                name: "Updated Project",
                comments: "Updated notes",
                status: "Completed",
                managerId: "3",
                employees: ["10"],
                start_date: "2025-01-01",
                end_date: "2025-06-30",
                security_level: "Confidential",
            });
        });

        // Must call updateProject, never createProject
        expect(mockedUpdateProject).toHaveBeenCalledTimes(1);
        expect(mockedUpdateProject).toHaveBeenCalledWith(
            "99",
            expect.objectContaining({ name: "Updated Project", transformed: true })
        );
        expect(mockedCreateProject).not.toHaveBeenCalled();
    });

    test("navigates home with 'updated' success message after submit", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject = projectApi.getProject as ReturnType<typeof vi.fn>;
        const mockedUpdateProject = projectApi.updateProject as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedGetProject.mockResolvedValue(EXISTING_PROJECT);
        mockedUpdateProject.mockResolvedValue(EXISTING_PROJECT);

        const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.submission({
                name: "Updated Project",
                comments: "",
                status: "Active",
                managerId: "3",
                employees: ["10"],
                start_date: "2025-01-01",
                end_date: "2025-12-31",
                security_level: "Internal",
            });
        });

        // Edit must say "updated", not "created"
        expect(mockNavigate).toHaveBeenCalledWith("/", {
            state: { successMessage: "Project updated successfully." },
        });
        expect(result.current.apiError).toBe("");
    });

    test("sets api error and does not navigate when update fails", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject = projectApi.getProject as ReturnType<typeof vi.fn>;
        const mockedUpdateProject = projectApi.updateProject as ReturnType<typeof vi.fn>;
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            mockedGetManagers.mockResolvedValue([]);
            mockedGetEmployees.mockResolvedValue([]);
            mockedGetProject.mockResolvedValue(EXISTING_PROJECT);
            mockedUpdateProject.mockRejectedValue({ response: { status: 500 } });

            const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await expect(
                    result.current.submission({
                        name: "Updated Project",
                        comments: "",
                        status: "Active",
                        managerId: "3",
                        employees: ["10"],
                        start_date: "2025-01-01",
                        end_date: "2025-12-31",
                        security_level: "Internal",
                    })
                ).rejects.toEqual(
                    expect.objectContaining({ response: { status: 500 } })
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

    test("sets api error when project fetch fails", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject = projectApi.getProject as ReturnType<typeof vi.fn>;
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            mockedGetManagers.mockResolvedValue([]);
            mockedGetEmployees.mockResolvedValue([]);
            mockedGetProject.mockRejectedValue(new Error("project not found"));

            const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.apiError).toBe("Failed to load project data. Please retry.");
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    test("reloadData refetches lookups and project in edit mode", async () => {
        const mockedGetManagers = projectApi.getManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject = projectApi.getProject as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedGetProject.mockResolvedValue(EXISTING_PROJECT);

        const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(mockedGetManagers).toHaveBeenCalledTimes(1);
        expect(mockedGetEmployees).toHaveBeenCalledTimes(1);
        expect(mockedGetProject).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.reloadData();
        });

        await waitFor(() => {
            expect(mockedGetManagers).toHaveBeenCalledTimes(2);
            expect(mockedGetEmployees).toHaveBeenCalledTimes(2);
            expect(mockedGetProject).toHaveBeenCalledTimes(2);
        });
    });
});
