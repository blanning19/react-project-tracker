import type { Dispatch, SetStateAction } from "react";
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
//
// sortIcon is intentionally NOT included here. It is a UI concern (which
// character to render) and belongs in HomeView, not in the controller or
// its prop contract. HomeView derives it from sort.key and sort.dir directly.

export interface HomePaginationProps {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    displayStart: number;
    displayEnd: number;
    setPage: Dispatch<SetStateAction<number>>;
    setPageSize: Dispatch<SetStateAction<number>>;
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
