import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useHomeController } from "../features/home/useHomeController";
import * as projectApi from "../features/projects/models/project.api";

vi.mock("../features/projects/models/project.api", () => ({
    listProjects: vi.fn(),
}));

describe("useHomeController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("loads projects on mount", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue([
            {
                id: 1,
                name: "Alpha Project",
                status: "Active",
                comments: "Initial planning work",
                start_date: "2026-03-01",
                end_date: "2026-03-10",
            },
        ]);

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        expect(mockedListProjects).toHaveBeenCalledTimes(1);
        expect(result.current.rows).toHaveLength(1);
        expect(result.current.state.apiError).toBe("");
    });

    test("sets an api error when project loading fails", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        mockedListProjects.mockRejectedValue(new Error("load failed"));

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        expect(result.current.state.apiError).toBe("Failed to load projects.");
        // rows is the paged slice; check total is 0
        expect(result.current.pagination.total).toBe(0);

        consoleErrorSpy.mockRestore();
    });

    test("filters projects by search text across name and comments", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue([
            {
                id: 1,
                name: "Alpha Project",
                status: "Active",
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
            expect(result.current.state.loading).toBe(false);
        });

        act(() => {
            result.current.filters.onSearchChange("search enhancement");
        });

        expect(result.current.rows).toHaveLength(1);
        expect(result.current.rows[0].name).toBe("Beta Project");
    });

    test("filters projects by status", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue([
            {
                id: 1,
                name: "Alpha Project",
                status: "Active",
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
            expect(result.current.state.loading).toBe(false);
        });

        act(() => {
            result.current.filters.onStatusFilterChange("Completed");
        });

        expect(result.current.rows).toHaveLength(1);
        expect(result.current.rows[0].name).toBe("Beta Project");
        expect(result.current.filters.statusFilter).toBe("Completed");
    });

    test("resets the current page back to 1 when search changes", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue(
            Array.from({ length: 25 }, (_, index) => ({
                id: index + 1,
                name: index === 0 ? "Alpha Project" : `Project ${index + 1}`,
                status: index % 2 === 0 ? "Active" : "Completed",
                comments: index === 0 ? "Alpha comments" : `Comments ${index + 1}`,
                start_date: "2026-03-01",
                end_date: "2026-03-10",
            }))
        );

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        act(() => {
            result.current.pagination.setPage(2);
        });

        expect(result.current.pagination.page).toBe(2);

        act(() => {
            result.current.filters.onSearchChange("alpha");
        });

        expect(result.current.pagination.page).toBe(1);
    });

    test("resets the current page back to 1 when status filter changes", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue(
            Array.from({ length: 25 }, (_, index) => ({
                id: index + 1,
                name: `Project ${index + 1}`,
                status: index % 2 === 0 ? "Active" : "Completed",
                comments: `Comments ${index + 1}`,
                start_date: "2026-03-01",
                end_date: "2026-03-10",
            }))
        );

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        act(() => {
            result.current.pagination.setPage(2);
        });

        expect(result.current.pagination.page).toBe(2);

        act(() => {
            result.current.filters.onStatusFilterChange("Completed");
        });

        expect(result.current.pagination.page).toBe(1);
    });

    test("reports active filters when search or status filter is applied", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue([
            {
                id: 1,
                name: "Alpha Project",
                status: "Active",
                comments: "Initial planning work",
                start_date: "2026-03-01",
                end_date: "2026-03-10",
            },
        ]);

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        expect(result.current.filters.hasActiveFilters).toBe(false);

        act(() => {
            result.current.filters.onSearchChange("alpha");
        });

        expect(result.current.filters.hasActiveFilters).toBe(true);
    });

    test("toggles sort direction when the same sort key is clicked twice", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue([
            {
                id: 1,
                name: "Bravo Project",
                status: "Active",
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
            expect(result.current.state.loading).toBe(false);
        });

        // Default sort is ascending by name — Alpha should be first
        expect(result.current.rows[0].name).toBe("Alpha Project");

        // Clicking the same key toggles to descending
        act(() => {
            result.current.sort.toggleSort("name");
        });

        expect(result.current.rows[0].name).toBe("Bravo Project");
    });

    test("uses refreshing state during a refresh load", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects
            .mockResolvedValueOnce([
                {
                    id: 1,
                    name: "Alpha Project",
                    status: "Active",
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
                                    status: "Active",
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
            expect(result.current.state.loading).toBe(false);
        });

        expect(result.current.state.refreshing).toBe(false);

        act(() => {
            void result.current.actions.getData({ isRefresh: true });
        });

        expect(result.current.state.refreshing).toBe(true);

        await waitFor(() => {
            expect(result.current.state.refreshing).toBe(false);
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
                    status: "Active",
                    comments: "Initial planning work",
                    start_date: "2026-03-01",
                    end_date: "2026-03-10",
                },
            ])
            .mockRejectedValueOnce(new Error("refresh failed"));

        const { result } = renderHook(() => useHomeController());

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        expect(result.current.pagination.total).toBe(1);

        act(() => {
            void result.current.actions.getData({ isRefresh: true });
        });

        await waitFor(() => {
            expect(result.current.state.refreshing).toBe(false);
        });

        expect(result.current.state.apiError).toBe("Failed to load projects.");
        expect(result.current.pagination.total).toBe(1);

        consoleErrorSpy.mockRestore();
    });
});
