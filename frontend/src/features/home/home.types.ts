import type { ProjectRecord } from "../projects/models/project.types";

export type HomeSortKey = keyof Pick<ProjectRecord, "name" | "status" | "comments" | "start_date" | "end_date">;

export type HomeSortDirection = "asc" | "desc";

export type HomeStatusFilter = "All" | "Open" | "In progress" | "Completed";