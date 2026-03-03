import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import * as yup from "yup";
import { useEditController } from "../features/projects/edit/useEditController";
import * as projectApi from "../features/projects/models/project.api";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "42" }),
}));

vi.mock("../features/projects/models/project.api", () => ({
    getEmployees: vi.fn(),
    getProject: vi.fn(),
    getProjectManagers: vi.fn(),
    updateProject: vi.fn(),
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
    projectToFormValues: vi.fn(() => ({
        name: "Loaded Project",
        comments: "Existing project comments",
        status: "Open",
        projectmanager: "1",
        employees: ["10", "11"],
        start_date: "2026-03-01",
        end_date: "2026-03-31",
    })),
}));

describe("useEditController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("loads lookup data and existing project data on mount", async () => {
        const mockedGetProjectManagers = projectApi.getProjectManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject = projectApi.getProject as ReturnType<typeof vi.fn>;

        mockedGetProjectManagers.mockResolvedValue([
            { id: 1, first_name: "Alice", last_name: "Manager" },
        ]);

        mockedGetEmployees.mockResolvedValue([
            { id: 10, first_name: "Bob", last_name: "Employee" },
        ]);

        mockedGetProject.mockResolvedValue({
            id: 42,
            name: "Loaded Project",
        });

        const { result } = renderHook(() => useEditController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockedGetProjectManagers).toHaveBeenCalledTimes(1);
        expect(mockedGetEmployees).toHaveBeenCalledTimes(1);
        expect(mockedGetProject).toHaveBeenCalledWith("42");

        expect(result.current.getValues("name")).toBe("Loaded Project");
        expect(result.current.getValues("comments")).toBe("Existing project comments");
        expect(result.current.getValues("status")).toBe("Open");
        expect(result.current.getValues("projectmanager")).toBe("1");
        expect(result.current.getValues("employees")).toEqual(["10", "11"]);
        expect(result.current.apiError).toBe("");
    });

    test("sets an api error when edit page data loading fails", async () => {
        const mockedGetProjectManagers = projectApi.getProjectManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject = projectApi.getProject as ReturnType<typeof vi.fn>;

        /**
         * Suppress expected console.error noise for this intentional error-path test.
         */
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            mockedGetProjectManagers.mockResolvedValue([]);
            mockedGetEmployees.mockResolvedValue([]);
            mockedGetProject.mockRejectedValue(new Error("project load failed"));

            const { result } = renderHook(() => useEditController());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.apiError).toBe("Failed to load project data.");
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    test("submits updated project data and navigates home on success", async () => {
        const mockedGetProjectManagers = projectApi.getProjectManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject = projectApi.getProject as ReturnType<typeof vi.fn>;
        const mockedUpdateProject = projectApi.updateProject as ReturnType<typeof vi.fn>;

        mockedGetProjectManagers.mockResolvedValue([]);
        mockedGetEmployees.mockResolvedValue([]);
        mockedGetProject.mockResolvedValue({ id: 42 });
        mockedUpdateProject.mockResolvedValue({ id: 42 });

        const { result } = renderHook(() => useEditController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.submission({
                name: "Updated Project",
                comments: "Updated comments",
                status: "Completed",
                projectmanager: "2",
                employees: ["10"],
                start_date: "2026-03-01",
                end_date: "2026-03-20",
            });
        });

        expect(mockedUpdateProject).toHaveBeenCalledTimes(1);
        expect(mockedUpdateProject).toHaveBeenCalledWith(
            "42",
            expect.objectContaining({
                name: "Updated Project",
                transformed: true,
            })
        );
        expect(mockNavigate).toHaveBeenCalledWith("/");
        expect(result.current.apiError).toBe("");
    });

    test("shows a status-based error when update fails without validation body", async () => {
        const mockedGetProjectManagers = projectApi.getProjectManagers as ReturnType<typeof vi.fn>;
        const mockedGetEmployees = projectApi.getEmployees as ReturnType<typeof vi.fn>;
        const mockedGetProject = projectApi.getProject as ReturnType<typeof vi.fn>;
        const mockedUpdateProject = projectApi.updateProject as ReturnType<typeof vi.fn>;

        /**
         * Suppress expected console.error noise for this intentional error-path test.
         */
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            mockedGetProjectManagers.mockResolvedValue([]);
            mockedGetEmployees.mockResolvedValue([]);
            mockedGetProject.mockResolvedValue({ id: 42 });
            mockedUpdateProject.mockRejectedValue({
                response: {
                    status: 500,
                },
            });

            const { result } = renderHook(() => useEditController());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.submission({
                    name: "Updated Project",
                    comments: "",
                    status: "Open",
                    projectmanager: "1",
                    employees: [],
                    start_date: "",
                    end_date: "",
                });
            });

            expect(result.current.apiError).toBe("Request failed (500).");
            expect(mockNavigate).not.toHaveBeenCalled();
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });
});