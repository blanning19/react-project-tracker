import { useCallback, useEffect, useMemo, useState } from "react";
import { listProjects } from "../projects/models/project.api";
import type { ProjectRecord } from "../projects/models/project.types";
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
 * - load project data from the backend
 * - manage loading, refreshing, and API error state
 * - manage pagination state
 * - manage sorting state
 * - manage search and status filter state
 * - derive the final visible rows used by the Home view
 *
 * Return shape is grouped into sub-objects so callers can destructure only
 * what they need without pulling in the entire flat surface:
 *
 *   const { rows, pagination, sort, filters, state, actions } = useHomeController();
 */
export function useHomeController() {
    // ── Raw data ────────────────────────────────────────────────────────────
    const [data, setData] = useState<ProjectRecord[]>([]);

    // ── UI state ────────────────────────────────────────────────────────────
    /**
     * True only during the very first page load when no data has been shown yet.
     */
    const [loading, setLoading] = useState(true);

    /**
     * True during subsequent reloads after the page already has data on screen.
     *
     * This allows the UI to keep the table visible while showing a smaller
     * "Refreshing..." indicator instead of replacing the whole page with a spinner.
     */
    const [refreshing, setRefreshing] = useState(false);

    /**
     * Human-readable API error shown in the page UI.
     */
    const [apiError, setApiError] = useState("");

    // ── Pagination ───────────────────────────────────────────────────────────
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(HOME_DEFAULT_PAGE_SIZE);

    // ── Sorting ──────────────────────────────────────────────────────────────
    const [sortKey, setSortKey] = useState<HomeSortKey>(HOME_DEFAULT_SORT_KEY);
    const [sortDir, setSortDir] = useState<HomeSortDirection>(HOME_DEFAULT_SORT_DIRECTION);

    // ── Filters ──────────────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<HomeStatusFilter>(HOME_DEFAULT_STATUS_FILTER);

    // ── Data fetching ────────────────────────────────────────────────────────

    /**
     * Loads the latest list of projects from the backend.
     *
     * Params:
     * - isRefresh:
     *   - false: treat as initial page load
     *   - true: treat as background refresh / retry while data is already visible
     */
    const getData = useCallback(async ({ isRefresh = false }: { isRefresh?: boolean } = {}) => {
        setApiError("");

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const projects = await listProjects();
            setData(projects);
        } catch (err) {
            console.error("GET /project/ failed:", (err as { data?: unknown })?.data ?? err);
            setApiError("Failed to load projects.");

            /**
             * Keep existing data during refresh failures so the page does not
             * unnecessarily blank out after users already had usable results.
             * Only clear data during the initial load failure.
             */
            if (!isRefresh) {
                setData([]);
            }
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        void getData();
    }, [getData]);

    // ── Action handlers ──────────────────────────────────────────────────────

    const onSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(1);
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

    // ── Derived data ─────────────────────────────────────────────────────────

    const filteredData = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return data.filter((row) => {
            const matchesSearch =
                normalizedSearch === "" ||
                (row.name ?? "").toLowerCase().includes(normalizedSearch) ||
                (row.comments ?? "").toLowerCase().includes(normalizedSearch);

            const matchesStatus =
                statusFilter === "All" || (row.status ?? "") === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [data, searchTerm, statusFilter]);

    const sortedData = useMemo(() => {
        const getSortableValue = (row: ProjectRecord) => {
            const value = row?.[sortKey as keyof ProjectRecord];
            if (value == null) return "";
            return typeof value === "string" ? value.toLowerCase() : value;
        };

        return [...filteredData].sort((a, b) => {
            const aValue = getSortableValue(a);
            const bValue = getSortableValue(b);
            if (aValue < bValue) return sortDir === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortKey, sortDir]);

    const total = sortedData.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = sortedData.slice(start, end);
    const hasActiveFilters =
        searchTerm.trim() !== "" || statusFilter !== HOME_DEFAULT_STATUS_FILTER;

    // ── Grouped return shape ─────────────────────────────────────────────────
    //
    // Grouped into sub-objects so HomeView can destructure only what it needs.
    // Previously this hook returned 20+ flat values including internal
    // derivations (start, end, safePage) that the view shouldn't care about,
    // and a sortIcon function that was a UI concern leaking into the controller.
    //
    // sortIcon has been moved to HomeView where it belongs — the controller
    // now exposes sortKey and sortDir and the view derives the icon itself.

    return {
        /** The current page of rows to render. */
        rows: pageRows,

        /** Pagination state needed by the view. */
        pagination: {
            page: safePage,
            pageSize,
            total,
            totalPages,
            /** 1-based start index for "Showing X–Y of Z" display. */
            displayStart: total === 0 ? 0 : start + 1,
            /** 1-based end index, clamped to total. */
            displayEnd: Math.min(end, total),
            setPage,
            setPageSize,
        },

        /** Sort state and toggle action. */
        sort: {
            key: sortKey,
            dir: sortDir,
            toggleSort,
        },

        /** Filter state and change handlers. */
        filters: {
            searchTerm,
            statusFilter,
            hasActiveFilters,
            onSearchChange,
            onStatusFilterChange,
        },

        /** Async load state. */
        state: {
            loading,
            refreshing,
            apiError,
        },

        /** Side-effect actions the view can trigger. */
        actions: {
            getData,
        },
    };
}
