/**
 * @file Tests for useEditController.
 *
 * Covers edit-specific behaviour:
 * - Fetches the existing project on mount and pre-populates the form
 * - Calls updateProject (not createProject) on submission
 * - Navigates to / with "Project updated successfully." on success
 * - Sets an api error when the project fetch fails
 * - reloadData refetches both lookup queries AND the project detail query
 * - Shows a status-based error when the update fails without a validation body
 *
 * Lookup behaviour (loading managers/employees, error states) is already
 * covered by useCreateController.test.tsx which exercises the shared
 * useProjectFormController hook. These tests focus only on what differs
 * in edit mode.
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import * as yup from "yup";
import { useEditController } from "../features/projects/edit/useEditController";
import * as projectApi from "../features/projects/models/project.api";

// ── Router mocks ─────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

// useParams is used by useEditController to extract the project ID from the route.
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "7" }),
}));

// ── API mocks ─────────────────────────────────────────────────────────────────

vi.mock("../features/projects/models/project.api", () => ({
    createProject: vi.fn(),
    getEmployees: vi.fn(),
    getManagers: vi.fn(),
    getProject: vi.fn(),
    updateProject: vi.fn(),
    projectKeys: {
        all:    () => ["projects"],
        lists:  () => ["projects", "list"],
        list:   (p: unknown) => ["projects", "list", p],
        detail: (id: unknown) => ["projects", "detail", String(id)],
    },
    lookupKeys: {
        managers:  () => ["lookups", "managers"],
        employees: () => ["lookups", "employees"],
    },
}));

// ── Form config mock ──────────────────────────────────────────────────────────

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
        name:           yup.string().required(),
        comments:       yup.string().default(""),
        status:         yup.string().required(),
        managerId:      yup.mixed().required(),
        employees:      yup.array().default([]),
        start_date:     yup.string().default(""),
        end_date:       yup.string().default(""),
        security_level: yup.string().required(),
    }),
    formToPayload: vi.fn((data) => ({ ...data, transformed: true })),
    projectToFormValues: vi.fn((project) => ({
        name:           project.name        ?? "",
        comments:       project.comments    ?? "",
        status:         project.status      ?? "",
        managerId:      project.manager     ? String(project.manager.id) : "",
        employees:      (project.employees  ?? []).map((e: { id: number }) => String(e.id)),
        start_date:     project.start_date  ?? "",
        end_date:       project.end_date    ?? "",
        security_level: project.security_level ?? "Internal",
    })),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal project record returned by getProject for id=7. */
const EXISTING_PROJECT = {
    id:             7,
    name:           "Existing Project",
    comments:       "Pre-existing comments",
    status:         "Active",
    manager:        { id: 3, name: "Alice Manager" },
    employees:      [{ id: 10, first_name: "Bob", last_name: "Employee" }],
    start_date:     "2025-01-01",
    end_date:       "2025-12-31",
    security_level: "Internal" as const,
};

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries:   { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useEditController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Project pre-population ────────────────────────────────────────────────

    test("fetches the existing project by id on mount", async () => {
        const mockedGetManagers  = projectApi.getManagers  as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject   = projectApi.getProject   as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedGetProject.mockResolvedValue(EXISTING_PROJECT);

        const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockedGetProject).toHaveBeenCalledTimes(1);
        expect(mockedGetProject).toHaveBeenCalledWith("7");
    });

    test("pre-populates the form with the fetched project values", async () => {
        const mockedGetManagers  = projectApi.getManagers  as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject   = projectApi.getProject   as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedGetProject.mockResolvedValue(EXISTING_PROJECT);

        const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // getValues() returns the current RHF field values after reset()
        const values = result.current.getValues();
        expect(values.name).toBe("Existing Project");
        expect(values.status).toBe("Active");
        expect(values.managerId).toBe("3");
        expect(values.employees).toEqual(["10"]);
    });

    // ── Submit calls updateProject ────────────────────────────────────────────

    test("calls updateProject with the project id on submission", async () => {
        const mockedGetManagers   = projectApi.getManagers   as ReturnType<typeof vi.fn>;
        const mockedGetEmployees  = projectApi.getEmployees  as ReturnType<typeof vi.fn>;
        const mockedGetProject    = projectApi.getProject    as ReturnType<typeof vi.fn>;
        const mockedUpdateProject = projectApi.updateProject as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedGetProject.mockResolvedValue(EXISTING_PROJECT);
        mockedUpdateProject.mockResolvedValue({ ...EXISTING_PROJECT, name: "Updated Name" });

        const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.submission({
                name:           "Updated Name",
                comments:       "Updated comments",
                status:         "On Hold",
                managerId:      "3",
                employees:      ["10"],
                start_date:     "2025-01-01",
                end_date:       "2025-12-31",
                security_level: "Confidential",
            });
        });

        // Must call updateProject, not createProject
        expect(mockedUpdateProject).toHaveBeenCalledTimes(1);
        expect(mockedUpdateProject).toHaveBeenCalledWith(
            "7",
            expect.objectContaining({ name: "Updated Name", transformed: true })
        );
        expect(projectApi.createProject).not.toHaveBeenCalled();
    });

    test("navigates to / with 'Project updated successfully.' on success", async () => {
        const mockedGetManagers   = projectApi.getManagers   as ReturnType<typeof vi.fn>;
        const mockedGetEmployees  = projectApi.getEmployees  as ReturnType<typeof vi.fn>;
        const mockedGetProject    = projectApi.getProject    as ReturnType<typeof vi.fn>;
        const mockedUpdateProject = projectApi.updateProject as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedGetProject.mockResolvedValue(EXISTING_PROJECT);
        mockedUpdateProject.mockResolvedValue(EXISTING_PROJECT);

        const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.submission({
                name:           "Existing Project",
                comments:       "",
                status:         "Active",
                managerId:      "3",
                employees:      ["10"],
                start_date:     "2025-01-01",
                end_date:       "2025-12-31",
                security_level: "Internal",
            });
        });

        expect(mockNavigate).toHaveBeenCalledWith("/", {
            state: { successMessage: "Project updated successfully." },
        });
    });

    // ── Project fetch error ───────────────────────────────────────────────────

    test("sets an api error when the project fetch fails", async () => {
        const mockedGetManagers  = projectApi.getManagers  as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject   = projectApi.getProject   as ReturnType<typeof vi.fn>;
        const consoleErrorSpy    = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            mockedGetManagers.mockResolvedValue([]);
            mockedGetEmployees.mockResolvedValue([]);
            mockedGetProject.mockRejectedValue(new Error("project fetch failed"));

            const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.apiError).toBe("Failed to load project data. Please retry.");
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    // ── Update failure ────────────────────────────────────────────────────────

    test("shows a status-based error when the update fails without a validation body", async () => {
        const mockedGetManagers   = projectApi.getManagers   as ReturnType<typeof vi.fn>;
        const mockedGetEmployees  = projectApi.getEmployees  as ReturnType<typeof vi.fn>;
        const mockedGetProject    = projectApi.getProject    as ReturnType<typeof vi.fn>;
        const mockedUpdateProject = projectApi.updateProject as ReturnType<typeof vi.fn>;
        const consoleErrorSpy     = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            mockedGetManagers.mockResolvedValue([]);
            mockedGetEmployees.mockResolvedValue([]);
            mockedGetProject.mockResolvedValue(EXISTING_PROJECT);
            mockedUpdateProject.mockRejectedValue({ response: { status: 500 } });

            const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.submission({
                    name:           "Existing Project",
                    comments:       "",
                    status:         "Active",
                    managerId:      "3",
                    employees:      ["10"],
                    start_date:     "2025-01-01",
                    end_date:       "2025-12-31",
                    security_level: "Internal",
                });
            });

            await waitFor(() => {
                expect(result.current.apiError).toBe("Request failed (500).");
            });

            expect(mockNavigate).not.toHaveBeenCalled();
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    test("shows field-level validation errors from the backend on update failure", async () => {
        const mockedGetManagers   = projectApi.getManagers   as ReturnType<typeof vi.fn>;
        const mockedGetEmployees  = projectApi.getEmployees  as ReturnType<typeof vi.fn>;
        const mockedGetProject    = projectApi.getProject    as ReturnType<typeof vi.fn>;
        const mockedUpdateProject = projectApi.updateProject as ReturnType<typeof vi.fn>;
        const consoleErrorSpy     = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            mockedGetManagers.mockResolvedValue([]);
            mockedGetEmployees.mockResolvedValue([]);
            mockedGetProject.mockResolvedValue(EXISTING_PROJECT);
            mockedUpdateProject.mockRejectedValue({
                response: {
                    status: 400,
                    data: { name: ["A project with this name already exists."] },
                },
            });

            const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.submission({
                    name:           "Duplicate Name",
                    comments:       "",
                    status:         "Active",
                    managerId:      "3",
                    employees:      ["10"],
                    start_date:     "2025-01-01",
                    end_date:       "2025-12-31",
                    security_level: "Internal",
                });
            });

            await waitFor(() => {
                expect(result.current.apiError).toBe(
                    "A project with this name already exists."
                );
            });
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    // ── reloadData in edit mode ───────────────────────────────────────────────

    test("reloadData refetches lookup queries AND the project detail query", async () => {
        const mockedGetManagers  = projectApi.getManagers  as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject   = projectApi.getProject   as ReturnType<typeof vi.fn>;

        mockedGetManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedGetProject.mockResolvedValue(EXISTING_PROJECT);

        const { result } = renderHook(() => useEditController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Baseline — each query fetched once on mount
        expect(mockedGetManagers).toHaveBeenCalledTimes(1);
        expect(mockedGetEmployees).toHaveBeenCalledTimes(1);
        expect(mockedGetProject).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.reloadData();
        });

        // All three must be refetched — this is the key difference from create mode
        await waitFor(() => {
            expect(mockedGetManagers).toHaveBeenCalledTimes(2);
            expect(mockedGetEmployees).toHaveBeenCalledTimes(2);
            expect(mockedGetProject).toHaveBeenCalledTimes(2);
        });
    });
});
