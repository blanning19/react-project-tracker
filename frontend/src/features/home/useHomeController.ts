/**
 * @file Controller hook for the Home (project list) page.
 *
 * @module home/useHomeController
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteProject, listProjects, projectKeys } from "../projects/models/project.api";
import {
    HOME_DEFAULT_PAGE_SIZE,
    HOME_DEFAULT_SORT_DIRECTION,
    HOME_DEFAULT_SORT_KEY,
    HOME_DEFAULT_STATUS_FILTER,
} from "./home.constants";
import type {
    DeleteTarget,
    HomeSortDirection,
    HomeSortKey,
    HomeStatusFilter,
    HomeViewProps,
} from "./home.types";

export function useHomeController(): HomeViewProps {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<HomeStatusFilter>(HOME_DEFAULT_STATUS_FILTER);
    const [sortKey, setSortKey] =
        useState<HomeSortKey>(HOME_DEFAULT_SORT_KEY);
    const [sortDir, setSortDir] =
        useState<HomeSortDirection>(HOME_DEFAULT_SORT_DIRECTION);
    const [page, setPage] = useState(1);
    const pageSize = HOME_DEFAULT_PAGE_SIZE;

    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
    const [deleteError, setDeleteError] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);

    const successMessage =
        (location.state as { successMessage?: string } | null)?.successMessage ?? "";

    const queryParams = {
        search: searchTerm === "" ? undefined : searchTerm,
        status: statusFilter === "All" ? undefined : statusFilter,
        ordering: sortDir === "desc" ? `-${sortKey}` : sortKey,
        page,
        page_size: pageSize,
    };

    const { data, isLoading, isFetching, isError } = useQuery({
        queryKey: projectKeys.list(queryParams),
        queryFn: () => listProjects(queryParams),
        placeholderData: (prev) => prev,
    });

    const getData = async () => {
        await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    };

    const onDeleteConfirm = async () => {
        if (!deleteTarget) return;

        setDeleteLoading(true);
        setDeleteError("");

        try {
            await deleteProject(deleteTarget.id);
            setDeleteTarget(null);
            await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        } catch {
            setDeleteError("Failed to delete project. Please try again.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const total = data?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const displayStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const displayEnd = Math.min(page * pageSize, total);

    const toggleSort = (key: HomeSortKey) => {
        if (key === sortKey) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
        setPage(1);
    };

    return {
        rows: data?.results ?? [],

        pagination: {
            page,
            pageSize,
            total,
            totalPages,
            displayStart,
            displayEnd,
            onPageChange: (nextPage: number) => setPage(nextPage),
            onPageSizeChange: (_: number) => {
                /* fixed page size for now */
            },
        },

        sort: {
            key: sortKey,
            dir: sortDir,
            toggleSort,
        },

        filters: {
            searchTerm,
            statusFilter,
            hasActiveFilters:
                searchTerm !== "" || statusFilter !== HOME_DEFAULT_STATUS_FILTER,
            onSearchChange: (value: string) => {
                setSearchTerm(value);
                setPage(1);
            },
            onStatusFilterChange: (value: HomeStatusFilter) => {
                setStatusFilter(value);
                setPage(1);
            },
        },

        state: {
            loading: isLoading,
            refreshing: isFetching && !isLoading,
            apiError: isError ? "Failed to load projects. Please retry." : "",
            successMessage,
            deleteError,
            deleteLoading,
        },

        actions: {
            getData,
            onDeleteConfirm,
        },

        navigation: {
            onNavigateCreate: () => navigate("/create"),
            onNavigateEdit: (id: number) => navigate(`/edit/${id}`),
            deleteTarget,
            onDeleteRequest: (target: DeleteTarget) => {
                setDeleteError("");
                setDeleteTarget(target);
            },
            onDeleteCancel: () => {
                setDeleteError("");
                setDeleteTarget(null);
            },
        },
    };
}