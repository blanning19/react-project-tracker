import FetchInstance from "../../../shared/http/fetchClient";
import { API } from "../../../shared/api/routes";
import type { PaginatedResponse, PersonOption, ProjectRecord } from "./project.types";

export const normalizeListResponse = <T,>(data: T[] | PaginatedResponse<T>): T[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
};

export const listProjects = async () => {
    const res = await FetchInstance.get<ProjectRecord[] | PaginatedResponse<ProjectRecord>>(API.projects.list);
    return normalizeListResponse<ProjectRecord>(res.data);
};

export const getProject = async (id: string | number) => {
    const res = await FetchInstance.get<ProjectRecord>(API.projects.detail(id));
    return res.data;
};

export const createProject = async (payload: unknown) => FetchInstance.post<ProjectRecord>(API.projects.list, payload);
export const updateProject = async (id: string | number, payload: unknown) => FetchInstance.put<ProjectRecord>(API.projects.detail(id), payload);
export const deleteProject = async (id: string | number) => FetchInstance.delete(API.projects.detail(id));

export const getProjectManagers = async () => {
    const res = await FetchInstance.get<PersonOption[] | PaginatedResponse<PersonOption>>(API.projectManagers);
    return normalizeListResponse<PersonOption>(res.data);
};

export const getEmployees = async () => {
    const res = await FetchInstance.get<PersonOption[] | PaginatedResponse<PersonOption>>(API.employees);
    return normalizeListResponse<PersonOption>(res.data);
};
