import { useEffect, useMemo, useState } from "react";
import { listProjects } from "../projects/models/project.api";
import type { ProjectRecord } from "../projects/models/project.types";

export const useHomeController = () => {
    const [data, setData] = useState<ProjectRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortKey, setSortKey] = useState<keyof ProjectRecord | "comments" | "status" | "start_date" | "end_date" | "name">("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const getData = async () => {
        setApiError("");
        setLoading(true);

        try {
            setData(await listProjects());
        } catch (err) {
            console.error("GET /project/ failed:", (err as { data?: unknown })?.data ?? err);
            setApiError("Failed to load projects.");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getData();
    }, []);

    const toggleSort = (key: keyof ProjectRecord | "comments" | "status" | "start_date" | "end_date" | "name") => {
        if (sortKey === key) setSortDir((direction) => direction === "asc" ? "desc" : "asc");
        else {
            setSortKey(key);
            setSortDir("asc");
        }

        setPage(1);
    };

    const sortedData = useMemo(() => {
        const getVal = (row: ProjectRecord) => {
            const value = row?.[sortKey as keyof ProjectRecord];
            if (value == null) return "";
            return typeof value === "string" ? value.toLowerCase() : value;
        };

        return [...data].sort((a, b) => {
            const av = getVal(a);
            const bv = getVal(b);
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortKey, sortDir]);

    const total = sortedData.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = sortedData.slice(start, end);
    const sortIcon = (key: string) => sortKey !== key ? "" : sortDir === "asc" ? " ▲" : " ▼";

    return { data, loading, apiError, page, pageSize, total, totalPages, safePage, start, end, pageRows, sortIcon, getData, setPage, setPageSize, toggleSort };
};
