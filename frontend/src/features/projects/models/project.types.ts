export interface PersonOption {
    id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
}

export interface ProjectRecord {
    id: number;
    name: string;
    comments?: string;
    status?: string;
    start_date?: string | null;
    end_date?: string | null;
    projectmanager?: number | PersonOption | null;
    employees?: Array<number | PersonOption>;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface ProjectFormValues {
    name: string;
    comments: string;
    status: string;
    projectmanager: string;
    employees: string[];
    start_date: string;
    end_date: string;
}
