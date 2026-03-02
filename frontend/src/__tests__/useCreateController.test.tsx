import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
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
    getProjectManagers: vi.fn(),
}));

vi.mock("../features/projects/shared/projectFormConfig", () => ({
    DEFAULT_VALUES: {
        name: "",
        comments: "",
        status: "",
        projectmanager: "",
        employees: [],
        start_date: "",
        end_date: "",
    },
    PROJECT_SCHEMA: yup.object({
        name: yup.string().required(),
        comments: yup.string().default(""),
        status: yup.string().required(),
        projectmanager: yup.mixed().required(),
        employees: yup.array().default([]),
        start_date: yup.string().default(""),
        end_date: yup.string().default(""),
    }),
    formToPayload: vi.fn((data) => ({
        ...data,
        transformed: true,
    })),
}));

describe("useCreateController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("loads project managers and employees on mount", async () => {
        const mockedGetProjectManagers = projectApi.getProjectManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;

        mockedGetProjectManagers.mockResolvedValue([
            { id: 1, first_name: "Alice", last_name: "Manager" },
        ]);

        mockedGetEmployees.mockResolvedValue([
            { id: 10, first_name: "Bob", last_name: "Employee" },
        ]);

        const { result } = renderHook(() => useCreateController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockedGetProjectManagers).toHaveBeenCalledTimes(1);
        expect(mockedGetEmployees).toHaveBeenCalledTimes(1);
        expect(result.current.projectManagers).toEqual([
            { id: 1, first_name: "Alice", last_name: "Manager" },
        ]);
        expect(result.current.employees).toEqual([
            { id: 10, first_name: "Bob", last_name: "Employee" },
        ]);
        expect(result.current.apiError).toBe("");
    });

    test("sets an api error when dropdown lookup loading fails", async () => {
        const mockedGetProjectManagers = projectApi.getProjectManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;

        mockedGetProjectManagers.mockRejectedValue(new Error("lookup failed"));
        mockedGetEmployees.mockResolvedValue([]);

        const { result } = renderHook(() => useCreateController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.apiError).toBe("Failed to load dropdown data.");
        expect(result.current.projectManagers).toEqual([]);
        expect(result.current.employees).toEqual([]);
    });

    test("submits a new project and navigates home on success", async () => {
        const mockedGetProjectManagers = projectApi.getProjectManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedCreateProject = projectApi.createProject as ReturnType<typeof vi.fn>;

        mockedGetProjectManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedCreateProject.mockResolvedValue({ id: 123 });

        const { result } = renderHook(() => useCreateController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.submission({
                name: "New Project",
                comments: "Create flow test",
                status: "Open",
                projectmanager: "1",
                employees: ["10", "11"],
                start_date: "2026-03-01",
                end_date: "2026-03-15",
            });
        });

        expect(mockedCreateProject).toHaveBeenCalledTimes(1);
        expect(mockedCreateProject).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "New Project",
                transformed: true,
            })
        );
        expect(mockNavigate).toHaveBeenCalledWith("/");
        expect(result.current.apiError).toBe("");
    });

    test("flattens backend validation errors into apiError on create failure", async () => {
        const mockedGetProjectManagers = projectApi.getProjectManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedCreateProject = projectApi.createProject as ReturnType<typeof vi.fn>;

        mockedGetProjectManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedCreateProject.mockRejectedValue({
            response: {
                status: 400,
                data: {
                    name: ["This field is required."],
                    employees: ["Select at least one employee."],
                },
            },
        });

        const { result } = renderHook(() => useCreateController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.submission({
                name: "",
                comments: "",
                status: "Open",
                projectmanager: "",
                employees: [],
                start_date: "",
                end_date: "",
            });
        });

        expect(result.current.apiError).toBe(
            "This field is required. Select at least one employee."
        );
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});