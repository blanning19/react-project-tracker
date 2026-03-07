import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listProjects, projectKeys } from "../projects/models/project.api";
import {
    HOME_DEFAULT_PAGE_SIZE,
    HOME_DEFAULT_SORT_DIRECTION,
    HOME_DEFAULT_SORT_KEY,
    HOME_DEFAULT_STATUS_FILTER,
} from "./home.constants";
import type { HomeSortDirection, HomeSortKey, HomeStatusFilter } from "./home.types";

/**
 * Controller hook for the Home page.
 *
 * Responsibilities:
 * - manage pagination, sort, and filter state
 * - pass those params to the backend via React Query
 * - expose the paginated result to HomeView
 *
 * All filtering, searching, sorting and pagination is now server-side.
 * The previous approach fetched all records and computed these in the browser,
 * which silently broke once record count exceeded PAGE_SIZE (50).
 *
 * React Query handles:
 * - initial loading state
 * - background refetch on window focus
 * - cache — navigating away and back does not re-spinner if data is fresh
 * - manual invalidation via getData({ isRefresh: true })
 *
 * Return shape is grouped into sub-objects so callers can destructure only
 * what they need:
 *
 *   const { rows, pagination, sort, filters, state, actions } = useHomeController();
 */
export function useHomeController() {
    // ── Pagination ───────────────────────────────────────────────────────────
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(HOME_DEFAULT_PAGE_SIZE);

    // ── Sorting ──────────────────────────────────────────────────────────────
    const [sortKey, setSortKey] = useState<HomeSortKey>(HOME_DEFAULT_SORT_KEY);
    const [sortDir, setSortDir] = useState<HomeSortDirection>(HOME_DEFAULT_SORT_DIRECTION);

    // ── Filters ──────────────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<HomeStatusFilter>(HOME_DEFAULT_STATUS_FILTER);

    // ── Query params ─────────────────────────────────────────────────────────
    //
    // Build the params object that gets sent to GET /api/project/.
    // React Query re-fetches automatically whenever this object changes
    // because it is part of the query key.
    //
    // Ordering: DRF expects ?ordering=name for asc, ?ordering=-name for desc.
    const ordering = sortDir === "asc" ? sortKey : `-${sortKey}`;

    const params = {
        page,
        page_size: pageSize,
        ordering,
        ...(searchTerm.trim() && { search: searchTerm.trim() }),
        ...(statusFilter !== "All" && { status: statusFilter }),
    };

    // ── Data fetching via React Query ────────────────────────────────────────
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,  // true only on the very first fetch (no cached data yet)
        isFetching, // true on any fetch, including background refetches
        isError,
        error,
    } = useQuery({
        queryKey: projectKeys.list(params),
        queryFn:  () => listProjects(params),
        // Keep previous page data visible while the next page loads.
        // Without this, switching pages flashes a loading spinner.
        placeholderData: (prev) => prev,
        // Re-fetch when the window regains focus so the table stays current
        // after a user switches tabs or minimises the browser.
        refetchOnWindowFocus: true,
        staleTime: 30_000, // treat data as fresh for 30 seconds
    });

    // ── Manual refresh ───────────────────────────────────────────────────────
    //
    // Called by the Refresh button and by DeleteModal's onDeleted callback.
    // Invalidating the lists key triggers a background refetch for the current
    // params without clearing the cached data first (so the table stays visible).
    const getData = async ({ isRefresh: _ = false }: { isRefresh?: boolean } = {}) => {
        await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    };

    // ── Action handlers ──────────────────────────────────────────────────────

    const onSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(1); // reset to page 1 whenever the search changes
    };

    const onStatusFilterChange = (value: HomeStatusFilter) => {
        setStatusFilter(value);
        setPage(1);
    };

    const toggleSort = (key: HomeSortKey) => {
        if (sortKey === key) {
            setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
        setPage(1);
    };

    const onPageChange = (newPage: number) => setPage(newPage);

    const onPageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setPage(1); // reset to page 1 when page size changes
    };

    // ── Derived values ───────────────────────────────────────────────────────

    const rows = data?.results ?? [];
    const total = data?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const displayStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const displayEnd = Math.min(page * pageSize, total);
    const hasActiveFilters =
        searchTerm.trim() !== "" || statusFilter !== HOME_DEFAULT_STATUS_FILTER;

    const apiError = isError
        ? ((error as { message?: string })?.message ?? "Failed to load projects.")
        : "";

    // ── Grouped return shape ─────────────────────────────────────────────────

    return {
        rows,

        pagination: {
            page,
            pageSize,
            total,
            totalPages,
            displayStart,
            displayEnd,
            onPageChange,
            onPageSizeChange,
        },

        sort: {
            key: sortKey,
            dir: sortDir,
            toggleSort,
        },

        filters: {
            searchTerm,
            statusFilter,
            hasActiveFilters,
            onSearchChange,
            onStatusFilterChange,
        },

        state: {
            // isLoading: first fetch only — shows the full-page spinner
            // isFetching && !isLoading: background refresh — shows "Refreshing..." indicator
            loading: isLoading,
            refreshing: isFetching && !isLoading,
            apiError,
        },

        actions: {
            getData,
        },
    };
}