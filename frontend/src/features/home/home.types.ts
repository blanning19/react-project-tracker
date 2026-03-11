/**
 * @file Prop and state types for the Home feature.
 *
 * All types are grouped to mirror the return shape of `useHomeController`,
 * making it easy to destructure only what a consumer needs.
 *
 * @module home/home.types
 */

import type { ProjectRecord } from "../projects/models/project.types";

/**
 * Keys of {@link ProjectRecord} that the home table can be sorted by.
 *
 * Keep in sync with the backend `ordering` fields accepted by
 * `GET /api/projects/`.
 */
export type HomeSortKey = keyof Pick<
    ProjectRecord,
    "name" | "status" | "comments" | "start_date" | "end_date" | "security_level"
>;

/** Sort direction for the home table. */
export type HomeSortDirection = "asc" | "desc";

/**
 * Status values the home table filter can be set to.
 *
 * @remarks
 * Keep in sync with:
 * - backend: `api/models.py Project.Status`
 * - frontend: `home.constants.ts HOME_STATUS_FILTER_OPTIONS`
 * - frontend: `projectFormConfig.ts STATUS_OPTIONS`
 */
export type HomeStatusFilter =
    | "All"
    | "Active"
    | "On Hold"
    | "Completed"
    | "Cancelled";

// ---------------------------------------------------------------------------
// HomeViewProps sub-groups — mirror useHomeController's return shape
// ---------------------------------------------------------------------------

/**
 * Pagination state and handlers passed to `HomeView`.
 *
 * Handler functions are exposed instead of raw `setState` dispatchers so
 * the view is decoupled from the controller's internal state representation.
 * Switching from `useState` to `useReducer` in the controller won't break
 * the view's prop contract.
 */
export interface HomePaginationProps {
    /** Current 1-based page number. */
    page: number;
    /** Number of records displayed per page. */
    pageSize: number;
    /** Total number of records matching the current filter across all pages. */
    total: number;
    /** Total number of pages, always at least 1. */
    totalPages: number;
    /** 1-based index of the first record shown on the current page. */
    displayStart: number;
    /** 1-based index of the last record shown on the current page. */
    displayEnd: number;
    /**
     * Navigate to a specific page.
     * @param page - The target 1-based page number.
     */
    onPageChange: (page: number) => void;
    /**
     * Change the number of records per page and reset to page 1.
     * @param size - The new page size.
     */
    onPageSizeChange: (size: number) => void;
}

/**
 * Sort state and toggle handler passed to `HomeView`.
 */
export interface HomeSortProps {
    /** The currently active sort column. */
    key: HomeSortKey;
    /** The current sort direction. */
    dir: HomeSortDirection;
    /**
     * Toggle or change the active sort column.
     * Clicking the active column reverses the direction; clicking a new
     * column switches to that column ascending.
     * @param key - The column key to sort by.
     */
    toggleSort: (key: HomeSortKey) => void;
}

/**
 * Filter state and change handlers passed to `HomeView`.
 */
export interface HomeFiltersProps {
    /** Current full-text search string. */
    searchTerm: string;
    /** Current status filter value. */
    statusFilter: HomeStatusFilter;
    /**
     * `true` when any filter deviates from its default value, used to
     * conditionally render a "Clear filters" button.
     */
    hasActiveFilters: boolean;
    /**
     * Update the search term and reset to page 1.
     * @param value - The new search string.
     */
    onSearchChange: (value: string) => void;
    /**
     * Update the status filter and reset to page 1.
     * @param value - The new status filter value.
     */
    onStatusFilterChange: (value: HomeStatusFilter) => void;
}

/**
 * Async loading and error state passed to `HomeView`.
 */
export interface HomeStateProps {
    /** `true` during the initial data fetch (no cached data exists yet). */
    loading: boolean;
    /**
     * `true` during a background refresh (cached data is already visible).
     * Used to show a subtle "Refreshing…" indicator without a full spinner.
     */
    refreshing: boolean;
    /** Non-empty error message string when the last fetch failed, otherwise `""`. */
    apiError: string;
}

/**
 * Action callbacks passed to `HomeView`.
 */
export interface HomeActionsProps {
    /**
     * Manually triggers a data refresh by invalidating the React Query cache
     * for the current list params.
     */
    getData: () => Promise<void>;
}

/**
 * Navigation and delete-modal props passed to `HomeView`.
 */
export interface HomeNavigationProps {
    /** Navigate to the Create project page. */
    onNavigateCreate: () => void;
    /**
     * Navigate to the Edit page for the given project.
     * @param id - The numeric project ID.
     */
    onNavigateEdit: (id: number) => void;
    /** The project currently targeted for deletion, or `null` when no modal is open. */
    deleteTarget: { id: number; name: string } | null;
    /**
     * Open the delete confirmation modal for a project.
     * @param target - The project to delete.
     */
    onDeleteRequest: (target: { id: number; name: string }) => void;
    /** Close the delete confirmation modal without deleting. */
    onDeleteCancel: () => void;
}

/**
 * Complete props interface for `HomeView`.
 *
 * Composed from the sub-group interfaces that mirror `useHomeController`'s
 * return shape. Consumers can destructure only the groups they need.
 *
 * @example
 * ```tsx
 * export default function HomeView({ rows, pagination, sort, filters, state, actions, navigation }: HomeViewProps) {
 *   const { page, totalPages, onPageChange } = pagination;
 *   // ...
 * }
 * ```
 */
export interface HomeViewProps {
    /** Current page of project records to render. */
    rows: ProjectRecord[];
    pagination: HomePaginationProps;
    sort: HomeSortProps;
    filters: HomeFiltersProps;
    state: HomeStateProps;
    actions: HomeActionsProps;
    navigation: HomeNavigationProps;
}
