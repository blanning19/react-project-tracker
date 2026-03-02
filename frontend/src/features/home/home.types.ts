import type { ProjectRecord } from "../projects/models/project.types";

/**
 * Supported sort keys for the Home page project list.
 *
 * These keys represent the fields the UI allows users to sort by.
 * Keeping this as a shared type prevents sort-key unions from being repeated
 * across the controller and view layers.
 */
export type HomeSortKey =
    | keyof ProjectRecord
    | "comments"
    | "status"
    | "start_date"
    | "end_date"
    | "name";

/**
 * Supported status filter values for the Home page.
 *
 * "All" means no status filtering is applied.
 */
export type HomeStatusFilter = "All" | "Open" | "In progress" | "Completed";

/**
 * State model for the Home page controller.
 *
 * This interface describes the core state values managed by the controller.
 * It is useful when you want a single place to understand the Home page's
 * primary data, loading behavior, pagination, sorting state, and search state.
 */
export interface HomeControllerState {
    data: ProjectRecord[];
    loading: boolean;
    apiError: string;
    searchQuery: string;
    page: number;
    pageSize: number;
    sortKey: HomeSortKey;
    sortDir: "asc" | "desc";
}