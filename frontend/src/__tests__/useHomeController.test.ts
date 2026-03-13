/**
 * @file Tests for useHomeController.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createElement } from "react";
import { describe, test, expect, beforeEach, vi } from "vitest";

import { useHomeController } from "../features/home/useHomeController";
import * as projectApi from "../features/projects/models/project.api";

const mockNavigate = vi.fn();
const mockLocation = {
    state: null as { successMessage?: string } | null,
    pathname: "/",
    search: "",
    hash: "",
    key: "default",
};

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
}));

vi.mock("../features/projects/models/project.api", () => ({
    listProjects: vi.fn(),
    deleteProject: vi.fn(),
    projectKeys: {
        all: () => ["projects"],
        lists: () => ["projects", "list"],
        list: (p: unknown) => ["projects", "list", p],
        detail: (id: unknown) => ["projects", "detail", String(id)],
    },
}));

const MOCK_PROJECTS = [
    { id: 1, name: "Alpha", status: "Active", comments: "First", start_date: "2025-01-01", end_date: "2025-06-01", security_level: "Internal" as const },
    { id: 2, name: "Beta", status: "On Hold", comments: "Second", start_date: "2025-03-01", end_date: "2025-09-01", security_level: "Confidential" as const },
];
const MOCK_PAGINATED = { count: 2, next: null, previous: null, results: MOCK_PROJECTS };

function createWrapper() {
    const qc = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    function TestQueryClientWrapper({ children }: { children: React.ReactNode }) {
        return createElement(QueryClientProvider, { client: qc }, children);
    }

    return TestQueryClientWrapper;
}

describe("useHomeController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocation.state = null;
    });

    test("loads projects on mount", async () => {
        (projectApi.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_PAGINATED);
        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.state.loading).toBe(false));
        expect(result.current.rows).toHaveLength(2);
        expect(result.current.pagination.total).toBe(2);
        expect(result.current.state.apiError).toBe("");
    });

    test("sets an api error when project loading fails", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        try {
            (projectApi.listProjects as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network error"));
            const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
            await waitFor(() => expect(result.current.state.loading).toBe(false));
            expect(result.current.state.apiError).toBe("Failed to load projects. Please retry.");
            expect(result.current.rows).toHaveLength(0);
        } finally {
            spy.mockRestore();
        }
    });

    test("filters projects by search text", async () => {
        const mock = projectApi.listProjects as ReturnType<typeof vi.fn>;
        mock.mockResolvedValue(MOCK_PAGINATED);
        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.state.loading).toBe(false));

        mock.mockResolvedValue({ count: 1, next: null, previous: null, results: [MOCK_PROJECTS[0]] });
        act(() => {
            result.current.filters.onSearchChange("Alpha");
        });

        await waitFor(() => {
            expect(mock).toHaveBeenCalledWith(expect.objectContaining({ search: "Alpha" }));
        });
    });

    test("filters projects by status", async () => {
        const mock = projectApi.listProjects as ReturnType<typeof vi.fn>;
        mock.mockResolvedValue(MOCK_PAGINATED);
        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.state.loading).toBe(false));

        act(() => {
            result.current.filters.onStatusFilterChange("Active");
        });
        await waitFor(() => {
            expect(mock).toHaveBeenCalledWith(expect.objectContaining({ status: "Active" }));
        });
    });

    test("resets page to 1 when search changes", async () => {
        const mock = projectApi.listProjects as ReturnType<typeof vi.fn>;
        mock.mockResolvedValue(MOCK_PAGINATED);
        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.state.loading).toBe(false));

        act(() => {
            result.current.pagination.onPageChange(3);
        });
        await waitFor(() => expect(result.current.pagination.page).toBe(3));

        act(() => {
            result.current.filters.onSearchChange("something");
        });
        await waitFor(() => expect(result.current.pagination.page).toBe(1));
    });

    test("resets page to 1 when status filter changes", async () => {
        const mock = projectApi.listProjects as ReturnType<typeof vi.fn>;
        mock.mockResolvedValue(MOCK_PAGINATED);
        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.state.loading).toBe(false));

        act(() => {
            result.current.pagination.onPageChange(2);
        });
        await waitFor(() => expect(result.current.pagination.page).toBe(2));

        act(() => {
            result.current.filters.onStatusFilterChange("Active");
        });
        await waitFor(() => expect(result.current.pagination.page).toBe(1));
    });

    test("reports active filters when search or status filter is applied", async () => {
        const mock = projectApi.listProjects as ReturnType<typeof vi.fn>;
        mock.mockResolvedValue(MOCK_PAGINATED);
        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.state.loading).toBe(false));

        act(() => {
            result.current.filters.onSearchChange("Alpha");
            result.current.filters.onStatusFilterChange("Active");
        });
        await waitFor(() => {
            expect(result.current.filters.searchTerm).toBe("Alpha");
            expect(result.current.filters.statusFilter).toBe("Active");
            expect(result.current.filters.hasActiveFilters).toBe(true);
        });
    });

    test("toggles sort direction when same sort key is clicked twice", async () => {
        const mock = projectApi.listProjects as ReturnType<typeof vi.fn>;
        mock.mockResolvedValue(MOCK_PAGINATED);
        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.state.loading).toBe(false));

        const key = result.current.sort.key;
        const dir = result.current.sort.dir;

        act(() => {
            result.current.sort.toggleSort(key);
        });
        await waitFor(() => expect(result.current.sort.dir).not.toBe(dir));

        act(() => {
            result.current.sort.toggleSort(key);
        });
        await waitFor(() => expect(result.current.sort.dir).toBe(dir));
    });

    test("triggers a background refetch when getData is called", async () => {
        const mock = projectApi.listProjects as ReturnType<typeof vi.fn>;
        mock.mockResolvedValue(MOCK_PAGINATED);
        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.state.loading).toBe(false));

        const before = mock.mock.calls.length;
        await act(async () => {
            await result.current.actions.getData();
        });
        await waitFor(() => expect(mock.mock.calls.length).toBeGreaterThan(before));
    });

    test("keeps existing data when a refresh request fails", async () => {
        const mock = projectApi.listProjects as ReturnType<typeof vi.fn>;
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        try {
            mock.mockResolvedValue(MOCK_PAGINATED);
            const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
            await waitFor(() => expect(result.current.state.loading).toBe(false));
            expect(result.current.rows).toHaveLength(2);

            mock.mockRejectedValueOnce(new Error("refresh failed"));
            await act(async () => {
                await result.current.actions.getData();
            });
            await waitFor(() => expect(result.current.rows).toHaveLength(2));
        } finally {
            spy.mockRestore();
        }
    });

    test("navigation.onNavigateCreate navigates to /create", async () => {
        (projectApi.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_PAGINATED);
        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.state.loading).toBe(false));

        act(() => {
            result.current.navigation.onNavigateCreate();
        });
        expect(mockNavigate).toHaveBeenCalledWith("/create");
    });

    test("navigation.onNavigateEdit navigates to /edit/:id", async () => {
        (projectApi.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_PAGINATED);
        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.state.loading).toBe(false));

        act(() => {
            result.current.navigation.onNavigateEdit(7);
        });
        expect(mockNavigate).toHaveBeenCalledWith("/edit/7");
    });

    test("navigation.onDeleteRequest sets deleteTarget, onDeleteCancel clears it", async () => {
        (projectApi.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_PAGINATED);
        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });
        await waitFor(() => expect(result.current.state.loading).toBe(false));

        expect(result.current.navigation.deleteTarget).toBeNull();

        act(() => {
            result.current.navigation.onDeleteRequest({ id: 1, name: "Alpha" });
        });
        await waitFor(() => expect(result.current.navigation.deleteTarget).toEqual({ id: 1, name: "Alpha" }));

        act(() => {
            result.current.navigation.onDeleteCancel();
        });
        await waitFor(() => expect(result.current.navigation.deleteTarget).toBeNull());
    });

    test("exposes successMessage from router state", async () => {
        (projectApi.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_PAGINATED);
        mockLocation.state = { successMessage: "Project created successfully." };

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.state.loading).toBe(false));

        expect(result.current.state.successMessage).toBe("Project created successfully.");
    });

    test("onDeleteConfirm deletes the selected project and clears deleteTarget", async () => {
        (projectApi.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_PAGINATED);
        (projectApi.deleteProject as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.state.loading).toBe(false));

        act(() => {
            result.current.navigation.onDeleteRequest({ id: 1, name: "Alpha" });
        });

        await waitFor(() => {
            expect(result.current.navigation.deleteTarget).toEqual({ id: 1, name: "Alpha" });
        });

        await act(async () => {
            await result.current.actions.onDeleteConfirm();
        });

        expect(projectApi.deleteProject).toHaveBeenCalledWith(1);
        expect(result.current.navigation.deleteTarget).toBeNull();
        expect(result.current.state.deleteError).toBe("");
        expect(result.current.state.deleteLoading).toBe(false);
    });

    test("onDeleteConfirm sets deleteError when deletion fails", async () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});

        try {
            (projectApi.listProjects as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_PAGINATED);
            (projectApi.deleteProject as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("delete failed"));

            const { result } = renderHook(() => useHomeController(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.state.loading).toBe(false));

            act(() => {
                result.current.navigation.onDeleteRequest({ id: 1, name: "Alpha" });
            });

            await act(async () => {
                await result.current.actions.onDeleteConfirm();
            });

            expect(projectApi.deleteProject).toHaveBeenCalledWith(1);
            expect(result.current.navigation.deleteTarget).toEqual({ id: 1, name: "Alpha" });
            expect(result.current.state.deleteError).toBe("Failed to delete project. Please try again.");
            expect(result.current.state.deleteLoading).toBe(false);
        } finally {
            spy.mockRestore();
        }
    });
});