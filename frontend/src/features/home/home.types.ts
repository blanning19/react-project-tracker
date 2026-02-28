import type { ProjectRecord } from "../projects/models/project.types";

export interface HomeControllerState {
    data: ProjectRecord[];
    loading: boolean;
    apiError: string;
    page: number;
    pageSize: number;
    sortKey: keyof ProjectRecord | "comments" | "status" | "start_date" | "end_date" | "name";
    sortDir: "asc" | "desc";
}
