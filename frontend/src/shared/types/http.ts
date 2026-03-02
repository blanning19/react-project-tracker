export interface ApiError extends Error {
    status?: number;
    code?: string;
    data?: unknown;
    response?: {
        status?: number;
        data?: unknown;
    };
}

export interface FetchResponse<T = unknown> {
    data: T;
    status: number;
    ok: boolean;
    headers: Record<string, string>;
}
