import type { ProjectRecord } from "../projects/models/project.types";

/**
 * Allowed sort keys for the Home table.
 *
 * Keep these in sync with:
 * - backend ordering fields in `api/views.py`
 * - rendered columns in `HomeView.tsx`
 */
export type HomeSortKey =
    | "name"
    | "status"
    | "comments"
    | "start_date"
    | "end_date"
    | "security_level";

/**
 * Sort direction supported by the Home table.
 */
export type HomeSortDirection = "asc" | "desc";

/**
 * Allowed status filter values for the Home page.
 *
 * Keep in sync with:
 * - backend `Project.Status`
 * - `home.constants.ts`
 * - `projectFormConfig.ts`
 */
export type HomeStatusFilter =
    | "All"
    | "Active"
    | "On Hold"
    | "Completed"
    | "Cancelled";

/**
 * Project currently targeted for deletion.
 */
export type DeleteTarget = { id: number; name: string } | null;

/**
 * Pagination state and handlers passed to `HomeView`.
 */
export interface HomePaginationProps {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    displayStart: number;
    displayEnd: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

/**
 * Sort state and toggle handler passed to `HomeView`.
 */
export interface HomeSortProps {
    key: HomeSortKey;
    dir: HomeSortDirection;
    toggleSort: (key: HomeSortKey) => void;
}

/**
 * Filter state and change handlers passed to `HomeView`.
 */
export interface HomeFiltersProps {
    searchTerm: string;
    statusFilter: HomeStatusFilter;
    hasActiveFilters: boolean;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: HomeStatusFilter) => void;
}

/**
 * Async loading and UI state passed to `HomeView`.
 */
export interface HomeStateProps {
    loading: boolean;
    refreshing: boolean;
    apiError: string;
    successMessage: string;
    deleteError: string;
    deleteLoading: boolean;
}

/**
 * Action callbacks passed to `HomeView`.
 */
export interface HomeActionsProps {
    getData: () => Promise<void>;
    onDeleteConfirm: () => Promise<void>;
}

/**
 * Navigation and delete-modal props passed to `HomeView`.
 */
export interface HomeNavigationProps {
    onNavigateCreate: () => void;
    onNavigateEdit: (id: number) => void;
    deleteTarget: DeleteTarget;
    onDeleteRequest: (target: DeleteTarget) => void;
    onDeleteCancel: () => void;
}

/**
 * Complete props interface for `HomeView`.
 */
export interface HomeViewProps {
    rows: ProjectRecord[];
    pagination: HomePaginationProps;
    sort: HomeSortProps;
    filters: HomeFiltersProps;
    state: HomeStateProps;
    actions: HomeActionsProps;
    navigation: HomeNavigationProps;
}