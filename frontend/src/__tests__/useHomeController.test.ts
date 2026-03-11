import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useHomeController } from "../features/home/useHomeController";
import * as projectApi from "../features/projects/models/project.api";


vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock("../features/projects/models/project.api", () => ({
    listProjects: vi.fn(),
    projectKeys: {
        all:   () => ["projects"],
        lists: () => ["projects", "list"],
        list:  (p: unknown) => ["projects", "list", p],
    },
    lookupKeys: {
        managers:  () => ["lookups", "managers"],
        employees: () => ["lookups", "employees"],
    },
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);
}

/** Wrap a flat array in the paginated envelope the hook expects. */
function paginated(items: object[]) {
    return { results: items, count: items.length };
}

describe("useHomeController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("loads projects on mount", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue(
            paginated([
                {
                    id: 1,
                    name: "Alpha Project",
                    status: "Active",
                    comments: "Initial planning work",
                    start_date: "2026-03-01",
                    end_date: "2026-03-10",
                },
            ])
        );

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

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

        // The hook reads error.message, so give the rejection a message property.
        mockedListProjects.mockRejectedValue({ message: "Failed to load projects." });

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        expect(result.current.state.apiError).toBe("Failed to load projects.");
        expect(result.current.pagination.total).toBe(0);

        consoleErrorSpy.mockRestore();
    });

    test("filters projects by search text across name and comments", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        // Initial load — both projects
        mockedListProjects.mockResolvedValueOnce(
            paginated([
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
            ])
        );

        // Re-fetch after search change — server returns only matching record
        mockedListProjects.mockResolvedValueOnce(
            paginated([
                {
                    id: 2,
                    name: "Beta Project",
                    status: "Completed",
                    comments: "Search enhancement completed",
                    start_date: "2026-03-05",
                    end_date: "2026-03-20",
                },
            ])
        );

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        act(() => {
            result.current.filters.onSearchChange("search enhancement");
        });

        await waitFor(() => {
            expect(result.current.rows).toHaveLength(1);
        });

        // FIX: Add ! — noUncheckedIndexedAccess widens rows[0] to ProjectRecord | undefined.
        expect(result.current.rows[0]!.name).toBe("Beta Project");
    });

    test("filters projects by status", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        // Initial load
        mockedListProjects.mockResolvedValueOnce(
            paginated([
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
            ])
        );

        // Re-fetch after status filter — server returns only Completed
        mockedListProjects.mockResolvedValueOnce(
            paginated([
                {
                    id: 2,
                    name: "Beta Project",
                    status: "Completed",
                    comments: "Completed release work",
                    start_date: "2026-03-05",
                    end_date: "2026-03-20",
                },
            ])
        );

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        act(() => {
            result.current.filters.onStatusFilterChange("Completed");
        });

        await waitFor(() => {
            expect(result.current.rows).toHaveLength(1);
        });

        // FIX: Add ! — noUncheckedIndexedAccess.
        expect(result.current.rows[0]!.name).toBe("Beta Project");
        expect(result.current.filters.statusFilter).toBe("Completed");
    });

    test("resets the current page back to 1 when search changes", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue(
            paginated(
                Array.from({ length: 25 }, (_, index) => ({
                    id: index + 1,
                    name: index === 0 ? "Alpha Project" : `Project ${index + 1}`,
                    status: index % 2 === 0 ? "Active" : "Completed",
                    comments: index === 0 ? "Alpha comments" : `Comments ${index + 1}`,
                    start_date: "2026-03-01",
                    end_date: "2026-03-10",
                }))
            )
        );

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        act(() => {
            result.current.pagination.onPageChange(2);
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
            paginated(
                Array.from({ length: 25 }, (_, index) => ({
                    id: index + 1,
                    name: `Project ${index + 1}`,
                    status: index % 2 === 0 ? "Active" : "Completed",
                    comments: `Comments ${index + 1}`,
                    start_date: "2026-03-01",
                    end_date: "2026-03-10",
                }))
            )
        );

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        act(() => {
            result.current.pagination.onPageChange(2);
        });

        expect(result.current.pagination.page).toBe(2);

        act(() => {
            result.current.filters.onStatusFilterChange("Completed");
        });

        expect(result.current.pagination.page).toBe(1);
    });

    test("reports active filters when search or status filter is applied", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue(
            paginated([
                {
                    id: 1,
                    name: "Alpha Project",
                    status: "Active",
                    comments: "Initial planning work",
                    start_date: "2026-03-01",
                    end_date: "2026-03-10",
                },
            ])
        );

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

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

        // Initial: asc — Alpha first
        mockedListProjects.mockResolvedValueOnce(
            paginated([
                { id: 2, name: "Alpha Project", status: "Completed", comments: "", start_date: "2026-03-05", end_date: "2026-03-20" },
                { id: 1, name: "Bravo Project", status: "Active",    comments: "", start_date: "2026-03-01", end_date: "2026-03-10" },
            ])
        );

        // After toggle to desc — Bravo first
        mockedListProjects.mockResolvedValueOnce(
            paginated([
                { id: 1, name: "Bravo Project", status: "Active",    comments: "", start_date: "2026-03-01", end_date: "2026-03-10" },
                { id: 2, name: "Alpha Project", status: "Completed", comments: "", start_date: "2026-03-05", end_date: "2026-03-20" },
            ])
        );

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        // FIX: Add ! — noUncheckedIndexedAccess.
        expect(result.current.rows[0]!.name).toBe("Alpha Project");

        act(() => {
            result.current.sort.toggleSort("name");
        });

        await waitFor(() => {
            // FIX: Add ! — noUncheckedIndexedAccess.
            expect(result.current.rows[0]!.name).toBe("Bravo Project");
        });
    });

    test("triggers a background refetch when getData is called", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;

        mockedListProjects.mockResolvedValue(
            paginated([
                {
                    id: 1,
                    name: "Alpha Project",
                    status: "Active",
                    comments: "Initial planning work",
                    start_date: "2026-03-01",
                    end_date: "2026-03-10",
                },
            ])
        );

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        await act(async () => {
            await result.current.actions.getData();
        });

        // invalidateQueries triggers a background refetch — called at least twice
        expect(mockedListProjects.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    test("keeps existing data when a refresh request fails", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        mockedListProjects
            .mockResolvedValueOnce(
                paginated([
                    {
                        id: 1,
                        name: "Alpha Project",
                        status: "Active",
                        comments: "Initial planning work",
                        start_date: "2026-03-01",
                        end_date: "2026-03-10",
                    },
                ])
            )
            .mockRejectedValueOnce({ message: "Failed to load projects." });

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.state.loading).toBe(false);
        });

        expect(result.current.pagination.total).toBe(1);

        await act(async () => {
            await result.current.actions.getData();
        });

        await waitFor(() => {
            expect(result.current.state.refreshing).toBe(false);
        });

        // placeholderData keeps the previous successful total visible
        expect(result.current.pagination.total).toBe(1);

        consoleErrorSpy.mockRestore();
    });

    test("navigation.onNavigateCreate navigates to /create", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;
        mockedListProjects.mockResolvedValue(paginated([]));

        const mockNavigate = vi.fn();
        const { useNavigate } = await import("react-router-dom");
        (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.state.loading).toBe(false));

        act(() => { result.current.navigation.onNavigateCreate(); });

        expect(mockNavigate).toHaveBeenCalledWith("/create");
    });

    test("navigation.onNavigateEdit navigates to /edit/:id", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;
        mockedListProjects.mockResolvedValue(paginated([]));

        const mockNavigate = vi.fn();
        const { useNavigate } = await import("react-router-dom");
        (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.state.loading).toBe(false));

        act(() => { result.current.navigation.onNavigateEdit(42); });

        expect(mockNavigate).toHaveBeenCalledWith("/edit/42");
    });

    test("navigation.onDeleteRequest sets deleteTarget, onDeleteCancel clears it", async () => {
        const mockedListProjects = projectApi.listProjects as ReturnType<typeof vi.fn>;
        mockedListProjects.mockResolvedValue(paginated([]));

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.state.loading).toBe(false));

        expect(result.current.navigation.deleteTarget).toBeNull();

        act(() => {
            result.current.navigation.onDeleteRequest({ id: 7, name: "Project Seven" });
        });

        expect(result.current.navigation.deleteTarget).toEqual({ id: 7, name: "Project Seven" });

        act(() => {
            result.current.navigation.onDeleteCancel();
        });

        expect(result.current.navigation.deleteTarget).toBeNull();
    });
});
