import type { ProjectRecord } from "../projects/models/project.types";

export type HomeSortKey = keyof Pick<ProjectRecord, "name" | "status" | "comments" | "start_date" | "end_date">;

export type HomeSortDirection = "asc" | "desc";

export type HomeStatusFilter = "All" | "Open" | "In progress" | "Completed";

export interface HomeViewProps {
    loading: boolean;
    apiError: string;
    total: number;
    totalPages: number;
    safePage: number;
    start: number;
    end: number;
    pageSize: number;
    pageRows: ProjectRecord[];
    refreshing: boolean;
    searchTerm: string;
    statusFilter: HomeStatusFilter;
    hasActiveFilters: boolean;
    sortKey: HomeSortKey;
    sortDir: HomeSortDirection;
    sortIcon: (key: HomeSortKey) => string;
    getData: (options?: { isRefresh?: boolean }) => Promise<void>;
    setPage: Dispatch<SetStateAction<number>>;
    setPageSize: Dispatch<SetStateAction<number>>;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: HomeStatusFilter) => void;
    toggleSort: (key: HomeSortKey) => void;
}