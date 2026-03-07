import type { ProjectRecord } from "../projects/models/project.types";

export type HomeSortKey = keyof Pick<
    ProjectRecord,
    "name" | "status" | "comments" | "start_date" | "end_date" | "security_level"
>;

export type HomeSortDirection = "asc" | "desc";

/**
 * Keep in sync with:
 * - backend: api/models.py Project.Status
 * - frontend: home.constants.ts HOME_STATUS_FILTER_OPTIONS
 * - frontend: projectFormConfig.ts STATUS_OPTIONS
 */
export type HomeStatusFilter =
    | "All"
    | "Active"
    | "On Hold"
    | "Completed"
    | "Cancelled";

// ---------------------------------------------------------------------------
// HomeViewProps — grouped to match useHomeController's return shape
// ---------------------------------------------------------------------------

export interface HomePaginationProps {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    displayStart: number;
    displayEnd: number;
    /**
     * Handler functions instead of raw setState dispatchers.
     *
     * Views should call onPageChange/onPageSizeChange rather than holding
     * a direct reference to setState. This keeps the controller's internal
     * state representation private and makes the prop contract stable if
     * the controller ever moves from useState to useReducer.
     */
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export interface HomeSortProps {
    key: HomeSortKey;
    dir: HomeSortDirection;
    toggleSort: (key: HomeSortKey) => void;
}

export interface HomeFiltersProps {
    searchTerm: string;
    statusFilter: HomeStatusFilter;
    hasActiveFilters: boolean;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: HomeStatusFilter) => void;
}

export interface HomeStateProps {
    loading: boolean;
    refreshing: boolean;
    apiError: string;
}

export interface HomeActionsProps {
    getData: (options?: { isRefresh?: boolean }) => Promise<void>;
}

export interface HomeViewProps {
    rows: ProjectRecord[];
    pagination: HomePaginationProps;
    sort: HomeSortProps;
    filters: HomeFiltersProps;
    state: HomeStateProps;
    actions: HomeActionsProps;
}