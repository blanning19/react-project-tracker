import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useHomeController } from "../features/home/useHomeController";
import * as projectApi from "../features/projects/models/project.api";

/**
 * Mock the Home page API module so controller tests can fully control
 * the returned project data and error behavior.
 */
vi.mock("../features/projects/models/project.api", () => ({
    listProjects: vi.fn(),
}));

describe("useHomeController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("loads projects on mount", async () => {
        /**
         * Typed reference to the mocked listProjects function.
         * Using the module namespace keeps the mock stable and easy to configure.
         */
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue([
            {
                id: 1,
                name: "Alpha Project",
                status: "Open",
                comments: "Initial planning work",
                start_date: "2026-03-01",
                end_date: "2026-03-10",
            },
        ]);

        const { result } = renderHook(() => useHomeController());

        /**
         * Wait for the initial async load to finish before asserting on results.
         */
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockedListProjects).toHaveBeenCalledTimes(1);
        expect(result.current.data).toHaveLength(1);
        expect(result.current.apiError).toBe("");
    });

    test("sets an api error when project loading fails", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        /**
         * Silence the expected console.error output for this error-path test so the
         * Vitest output stays focused on assertion results instead of known logs.
         */
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        mockedListProjects.mockRejectedValue(new Error("load failed"));

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.apiError).toBe("Failed to load projects.");
        expect(result.current.data).toEqual([]);

        consoleErrorSpy.mockRestore();
    });

    test("filters projects by search text across name and comments", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue([
            {
                id: 1,
                name: "Alpha Project",
                status: "Open",
                comments: "Initial planning work",
                start_date: "2026-03-01",
                end_date: "2026-03-10",
            },
            {
                id: 2,
                name: "Beta Project",
                status: "Completed",
                comments: "Search enhancement completed",
                start_date: "2026-03-05",
                end_date: "2026-03-20",
            },
        ]);

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        /**
         * Search should match both project names and project comments.
         */
        act(() => {
            result.current.onSearchChange("search enhancement");
        });

        expect(result.current.pageRows).toHaveLength(1);
        expect(result.current.pageRows[0].name).toBe("Beta Project");
    });

    test("filters projects by status", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue([
            {
                id: 1,
                name: "Alpha Project",
                status: "Open",
                comments: "Initial planning work",
                start_date: "2026-03-01",
                end_date: "2026-03-10",
            },
            {
                id: 2,
                name: "Beta Project",
                status: "Completed",
                comments: "Completed release work",
                start_date: "2026-03-05",
                end_date: "2026-03-20",
            },
        ]);

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.onStatusFilterChange("Completed");
        });

        expect(result.current.pageRows).toHaveLength(1);
        expect(result.current.pageRows[0].name).toBe("Beta Project");
        expect(result.current.statusFilter).toBe("Completed");
    });

    test("resets the current page back to 1 when search changes", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue(
            Array.from({ length: 25 }, (_, index) => ({
                id: index + 1,
                name: index === 0 ? "Alpha Project" : `Project ${index + 1}`,
                status: index % 2 === 0 ? "Open" : "Completed",
                comments: index === 0 ? "Alpha comments" : `Comments ${index + 1}`,
                start_date: "2026-03-01",
                end_date: "2026-03-10",
            }))
        );

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.setPage(2);
        });

        expect(result.current.safePage).toBe(2);

        /**
         * Search changes should always move the user back to the first page.
         */
        act(() => {
            result.current.onSearchChange("alpha");
        });

        expect(result.current.safePage).toBe(1);
    });

    test("resets the current page back to 1 when status filter changes", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue(
            Array.from({ length: 25 }, (_, index) => ({
                id: index + 1,
                name: `Project ${index + 1}`,
                status: index % 2 === 0 ? "Open" : "Completed",
                comments: `Comments ${index + 1}`,
                start_date: "2026-03-01",
                end_date: "2026-03-10",
            }))
        );

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.setPage(2);
        });

        expect(result.current.safePage).toBe(2);

        act(() => {
            result.current.onStatusFilterChange("Completed");
        });

        expect(result.current.safePage).toBe(1);
    });

    test("reports active filters when search or status filter is applied", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue([
            {
                id: 1,
                name: "Alpha Project",
                status: "Open",
                comments: "Initial planning work",
                start_date: "2026-03-01",
                end_date: "2026-03-10",
            },
        ]);

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.hasActiveFilters).toBe(false);

        act(() => {
            result.current.onSearchChange("alpha");
        });

        expect(result.current.hasActiveFilters).toBe(true);
    });

    test("toggles sort direction when the same sort key is clicked twice", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue([
            {
                id: 1,
                name: "Bravo Project",
                status: "Open",
                comments: "",
                start_date: "2026-03-01",
                end_date: "2026-03-10",
            },
            {
                id: 2,
                name: "Alpha Project",
                status: "Completed",
                comments: "",
                start_date: "2026-03-05",
                end_date: "2026-03-20",
            },
        ]);

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        /**
         * Default name sort is ascending, so Alpha should appear first initially.
         */
        expect(result.current.pageRows[0].name).toBe("Alpha Project");

        /**
         * Clicking the same sort key again should toggle to descending order.
         */
        act(() => {
            result.current.toggleSort("name");
        });

        expect(result.current.pageRows[0].name).toBe("Bravo Project");
    });

    test("uses refreshing state during a refresh load", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects
            .mockResolvedValueOnce([
                {
                    id: 1,
                    name: "Alpha Project",
                    status: "Open",
                    comments: "Initial planning work",
                    start_date: "2026-03-01",
                    end_date: "2026-03-10",
                },
            ])
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        setTimeout(() => {
                            resolve([
                                {
                                    id: 1,
                                    name: "Alpha Project",
                                    status: "Open",
                                    comments: "Initial planning work",
                                    start_date: "2026-03-01",
                                    end_date: "2026-03-10",
                                },
                            ]);
                        }, 0);
                    })
            );

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.refreshing).toBe(false);

        act(() => {
            void result.current.getData({ isRefresh: true });
        });

        expect(result.current.refreshing).toBe(true);

        await waitFor(() => {
            expect(result.current.refreshing).toBe(false);
        });
    });

    test("keeps existing data when a refresh request fails", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        mockedListProjects
            .mockResolvedValueOnce([
                {
                    id: 1,
                    name: "Alpha Project",
                    status: "Open",
                    comments: "Initial planning work",
                    start_date: "2026-03-01",
                    end_date: "2026-03-10",
                },
            ])
            .mockRejectedValueOnce(new Error("refresh failed"));

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toHaveLength(1);

        act(() => {
            void result.current.getData({ isRefresh: true });
        });

        await waitFor(() => {
            expect(result.current.refreshing).toBe(false);
        });

        expect(result.current.apiError).toBe("Failed to load projects.");
        expect(result.current.data).toHaveLength(1);

        consoleErrorSpy.mockRestore();
    });

});