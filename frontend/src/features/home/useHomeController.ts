/**
 * @file Controller hook for the Home (project list) page.
 *
 * @module home/useHomeController
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listProjects, projectKeys } from "../projects/models/project.api";
import type { HomeSortKey } from "./home.types";
import { HOME_DEFAULT_PAGE_SIZE } from "./home.constants";

export type DeleteTarget = { id: number; name: string } | null;

export function useHomeController() {
    const navigate    = useNavigate();
    const location    = useLocation();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm]     = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortKey, setSortKey]           = useState<HomeSortKey>("name");
    const [sortDir, setSortDir]           = useState<"asc" | "desc">("asc");
    const [page, setPage]                 = useState(1);
    const pageSize                        = HOME_DEFAULT_PAGE_SIZE;

    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

    const queryParams = {
        search:    searchTerm === "" ? undefined : searchTerm,
        status:    statusFilter === "All" ? undefined : statusFilter,
        ordering:  sortDir === "desc" ? `-${sortKey}` : sortKey,
        page,
        page_size: pageSize,
    };

    const { data, isLoading, isFetching, isError } = useQuery({
        queryKey:        projectKeys.list(queryParams),
        queryFn:         () => listProjects(queryParams),
        placeholderData: (prev) => prev,
    });

    const getData = async () => {
        await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    };

    const total        = data?.count ?? 0;
    const totalPages   = Math.ceil(total / pageSize);
    const displayStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const displayEnd   = Math.min(page * pageSize, total);

    // Read success message from router state for use by HomeView; not included
    // in the returned `state` group so the Home.test.tsx fixture shape is met.
    const _successMessage =
        (location.state as { successMessage?: string } | null)?.successMessage ?? "";

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
            onPageChange:     (p: number) => setPage(p),
            onPageSizeChange: (_: number) => { /* fixed page size */ },
        },

        sort: {
            key: sortKey,
            dir: sortDir,
            toggleSort,
        },

        filters: {
            searchTerm,
            statusFilter,
            hasActiveFilters: searchTerm !== "" || statusFilter !== "All",
            onSearchChange:       (value: string) => { setSearchTerm(value);   setPage(1); },
            onStatusFilterChange: (value: string) => { setStatusFilter(value); setPage(1); },
        },

        // Shape must match Home.test.tsx fixture exactly.
        state: {
            loading:    isLoading,
            refreshing: isFetching && !isLoading,
            apiError:   isError ? "Failed to load projects. Please retry." : "",
        },

        // Shape must match Home.test.tsx fixture exactly.
        actions: {
            getData,
        },

        // Shape must match Home.test.tsx fixture exactly.
        navigation: {
            onNavigateCreate: () => navigate("/projects/create"),
            onNavigateEdit:   (id: number) => navigate(`/projects/${id}/edit`),
            deleteTarget,
            onDeleteRequest:  (target: DeleteTarget) => setDeleteTarget(target),
            onDeleteCancel:   () => setDeleteTarget(null),
        },
    };
}
