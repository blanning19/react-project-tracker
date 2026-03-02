import { useCallback, useEffect, useMemo, useState } from "react";
import { listProjects } from "../projects/models/project.api.ts";
import type { ProjectRecord } from "../projects/models/project.types.ts";
import type { HomeSortKey, HomeStatusFilter } from "./home.types";

/**
 * Controller hook for the Home page.
 *
 * Responsibilities:
 * - load project data from the backend
 * - manage loading and API error state
 * - manage pagination state
 * - manage sorting state
 * - manage search and status filter state
 * - derive the final visible rows used by the Home view
 *
 * Why this hook exists:
 * - keeps page logic out of the rendering layer
 * - centralizes state transitions in one predictable place
 * - makes the Home view simpler and easier to test
 */
export function useHomeController() {
    /**
     * Raw project records returned from the backend.
     *
     * This is the unfiltered, unsorted source data used to derive the
     * final rows displayed on the current page.
     */
    const [data, setData] = useState<ProjectRecord[]>([]);

    /**
     * True while the initial Home page data request is in flight.
     */
    const [loading, setLoading] = useState(true);

    /**
     * Human-readable API error shown in the page UI.
     */
    const [apiError, setApiError] = useState("");

    /**
     * Current 1-based page number used for client-side pagination.
     */
    const [page, setPage] = useState(1);

    /**
     * Number of rows shown per page.
     */
    const [pageSize, setPageSize] = useState(10);

    /**
     * Currently active sort field.
     */
    const [sortKey, setSortKey] = useState<HomeSortKey>("name");

    /**
     * Current sort direction for the active sort field.
     */
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    /**
     * Current free-text search value.
     *
     * The search is applied against project name and comments.
     */
    const [searchTerm, setSearchTerm] = useState("");

    /**
     * Current status filter value.
     *
     * "All" means no status filtering is applied.
     */
    const [statusFilter, setStatusFilter] = useState<HomeStatusFilter>("All");

    /**
     * Loads the latest list of projects from the backend.
     *
     * Behavior:
     * - clears any previous API error
     * - enters loading state
     * - requests projects from the API
     * - stores results on success
     * - stores a user-facing error and clears data on failure
     */
    const getData = useCallback(async () => {
        setApiError("");
        setLoading(true);

        try {
            const projects = await listProjects();
            setData(projects);
        } catch (err) {
            console.error("GET /project/ failed:", (err as { data?: unknown })?.data ?? err);
            setApiError("Failed to load projects.");
            setData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Load the project list once when the Home page first mounts.
     */
    useEffect(() => {
        void getData();
    }, [getData]);

    /**
     * Updates the current search text and resets pagination back to page 1.
     *
     * Resetting the page prevents the UI from being stranded on an invalid
     * or confusing later page after the result set shrinks.
     */
    const onSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(1);
    };

    /**
     * Updates the active status filter and resets pagination back to page 1.
     */
    const onStatusFilterChange = (value: HomeStatusFilter) => {
        setStatusFilter(value);
        setPage(1);
    };

    /**
     * Updates the active sort field and direction.
     *
     * Behavior:
     * - clicking the same field toggles ascending/descending
     * - clicking a new field switches to ascending order by default
     * - resets to page 1 so the user sees the top of the newly sorted results
     */
    const toggleSort = (key: HomeSortKey) => {
        if (sortKey === key) {
            setSortDir((currentDirection) =>
                currentDirection === "asc" ? "desc" : "asc"
            );
        } else {
            setSortKey(key);
            setSortDir("asc");
        }

        setPage(1);
    };

    /**
     * Returns rows that match the current search text and status filter.
     *
     * Filtering happens before sorting and pagination so all downstream
     * derived values reflect the reduced result set.
     */
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

    /**
     * Returns the filtered rows sorted by the active sort field and direction.
     *
     * Normalization rules:
     * - null/undefined become empty strings for stable comparisons
     * - strings are lowercased to make sorting case-insensitive
     */
    const sortedData = useMemo(() => {
        const getSortableValue = (row: ProjectRecord) => {
            const value = row?.[sortKey as keyof ProjectRecord];

            if (value == null) {
                return "";
            }

            return typeof value === "string" ? value.toLowerCase() : value;
        };

        return [...filteredData].sort((a, b) => {
            const aValue = getSortableValue(a);
            const bValue = getSortableValue(b);

            if (aValue < bValue) {
                return sortDir === "asc" ? -1 : 1;
            }

            if (aValue > bValue) {
                return sortDir === "asc" ? 1 : -1;
            }

            return 0;
        });
    }, [filteredData, sortKey, sortDir]);

    /**
     * Total number of rows remaining after filters and sorting are applied.
     */
    const total = sortedData.length;

    /**
     * Total number of pages available for the current page size.
     *
     * A minimum of 1 keeps pagination display stable even when there are no rows.
     */
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    /**
     * Clamps the current page to a valid page number.
     *
     * This protects the view when page size changes or filtering reduces
     * the number of available pages.
     */
    const safePage = Math.min(page, totalPages);

    /**
     * Start and end indexes used to slice the current page of rows.
     */
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    /**
     * Rows visible on the current page after filtering, sorting, and pagination.
     */
    const pageRows = sortedData.slice(start, end);

    /**
     * True when the user has any active search or filter applied.
     *
     * This helps the view choose between:
     * - "no projects yet"
     * - "no projects match your filters"
     */
    const hasActiveFilters =
        searchTerm.trim() !== "" || statusFilter !== "All";

    /**
     * Returns the visual sort indicator for a given column.
     */
    const sortIcon = (key: HomeSortKey) =>
        sortKey !== key ? "" : sortDir === "asc" ? " ▲" : " ▼";

    return {
        data,
        loading,
        apiError,
        page,
        pageSize,
        searchTerm,
        statusFilter,
        total,
        totalPages,
        safePage,
        start,
        end,
        pageRows,
        hasActiveFilters,
        sortIcon,
        getData,
        setPage,
        setPageSize,
        onSearchChange,
        onStatusFilterChange,
        toggleSort,
    };
}