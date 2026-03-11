/**
 * @file Controller hook for the Home page.
 *
 * @module home/useHomeController
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
 * The project currently targeted by the delete confirmation modal, or `null`
 * when the modal is closed.
 */
export type DeleteTarget = { id: number; name: string } | null;

/**
 * Controller hook for the Home page.
 *
 * Manages all state for the project list — pagination, sorting, filtering,
 * and navigation — and delegates data fetching to React Query.
 *
 * ### Responsibilities
 * - Maintain pagination, sort, and filter state.
 * - Build the query params object and pass it to `listProjects`.
 * - Expose a `getData` action for manual cache invalidation.
 * - Own the delete modal target state and surface it via `navigation`.
 *
 * ### Why server-side filtering?
 * The previous approach fetched all records and filtered in the browser.
 * This silently broke once the record count exceeded `PAGE_SIZE`. All
 * filtering, searching, ordering, and pagination now happens on the backend.
 *
 * ### React Query behaviour
 * - `isLoading` — `true` only on the very first fetch (no cached data yet).
 *   Used to show the full-page spinner.
 * - `isFetching` — `true` on any fetch including background refetches.
 *   Used to show the subtle "Refreshing…" indicator.
 * - `placeholderData` — keeps the previous page visible while the next page
 *   loads, avoiding a flash of the loading spinner on pagination.
 * - `refetchOnWindowFocus` — keeps the table current after the user switches
 *   tabs or minimises the browser.
 *
 * ### Return shape
 * Props are grouped into sub-objects so `HomeView` can destructure only what
 * it needs:
 * ```ts
 * const { rows, pagination, sort, filters, state, actions, navigation } = useHomeController();
 * ```
 *
 * @returns The complete grouped prop set for `HomeView`.
 */
export function useHomeController() {
    const navigate = useNavigate();

    // ── Delete target ────────────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

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
    // React Query re-fetches automatically whenever `params` changes because
    // the object is included in the query key.
    // DRF ordering: `?ordering=name` → ascending, `?ordering=-name` → descending.
    const ordering = sortDir === "asc" ? sortKey : `-${sortKey}`;

    const params = {
        page,
        page_size: pageSize,
        ordering,
        ...(searchTerm.trim() && { search: searchTerm.trim() }),
        ...(statusFilter !== "All" && { status: statusFilter }),
    };

    // ── Data fetching ────────────────────────────────────────────────────────
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
    } = useQuery({
        queryKey: projectKeys.list(params),
        queryFn:  () => listProjects(params),
        placeholderData: (prev) => prev,
        refetchOnWindowFocus: true,
        staleTime: 30_000,
    });

    // ── Manual refresh ───────────────────────────────────────────────────────
    /**
     * Manually invalidates the project list cache, triggering a background
     * refetch for the current params without clearing the visible data first.
     *
     * Called by the Refresh button and by the `DeleteModal.onDeleted` callback.
     */
    const getData = async () => {
        await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    };

    // ── Action handlers ──────────────────────────────────────────────────────

    /** Update the search term and reset to page 1. */
    const onSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(1);
    };

    /** Update the status filter and reset to page 1. */
    const onStatusFilterChange = (value: HomeStatusFilter) => {
        setStatusFilter(value);
        setPage(1);
    };

    /**
     * Toggle or change the active sort column.
     * Clicking the active column reverses direction; clicking a new column
     * switches to it ascending and resets to page 1.
     */
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

    /** Update the page size and reset to page 1. */
    const onPageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setPage(1);
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
            loading: isLoading,
            refreshing: isFetching && !isLoading,
            apiError,
        },

        actions: {
            getData,
        },

        navigation: {
            onNavigateCreate: () => navigate("/create"),
            onNavigateEdit: (id: number) => navigate(`/edit/${id}`),
            deleteTarget,
            onDeleteRequest: (target: DeleteTarget) => setDeleteTarget(target),
            onDeleteCancel: () => setDeleteTarget(null),
        },
    };
}
