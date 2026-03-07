import type { HomeSortDirection, HomeSortKey, HomeStatusFilter } from "./home.types";

/**
 * Default number of rows shown in the Home table.
 */
export const HOME_DEFAULT_PAGE_SIZE = 10;

/**
 * Available page-size choices shown in the Home rows-per-page selector.
 */
export const HOME_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

/**
 * Default sort column for the Home table.
 */
export const HOME_DEFAULT_SORT_KEY: HomeSortKey = "name";

/**
 * Default sort direction for the Home table.
 */
export const HOME_DEFAULT_SORT_DIRECTION: HomeSortDirection = "asc";

/**
 * Available status filter values shown in the Home filter dropdown.
 *
 * FIX: Updated to match backend Project.Status TextChoices.
 * Previous values ("Open", "In progress") no longer exist in the backend.
 *
 * Keep in sync with:
 * - backend:  api/models.py Project.Status
 * - frontend: home.types.ts HomeStatusFilter
 * - frontend: projectFormConfig.ts STATUS_OPTIONS
 */
export const HOME_STATUS_FILTER_OPTIONS: HomeStatusFilter[] = [
    "All",
    "Active",
    "On Hold",
    "Completed",
    "Cancelled",
];

/**
 * Default status filter used when the page first loads.
 */
export const HOME_DEFAULT_STATUS_FILTER: HomeStatusFilter = "All";
