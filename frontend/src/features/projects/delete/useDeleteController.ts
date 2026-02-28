import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteProject, getProject } from "../models/project.api";
import type { ProjectRecord } from "../models/project.types";

export const useDeleteController = () => {
    const { id: projectId = "" } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<ProjectRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    useEffect(() => {
        const getData = async () => {
            setApiError("");
            setLoading(true);

            try {
                setData(await getProject(projectId));
            } catch (err) {
                console.error("GET project failed:", (err as { data?: unknown })?.data ?? err);
                setApiError("Failed to load project details.");
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) getData();
    }, [projectId]);

    const submission = async () => {
        setApiError("");

        try {
            await deleteProject(projectId);
            navigate("/");
        } catch (err) {
            console.error("DELETE project failed:", (err as { data?: unknown })?.data ?? err);
            const errorsObj = (err as { data?: Record<string, string[]> })?.data;
            if (errorsObj && typeof errorsObj === "object") setApiError(Object.values(errorsObj).flat().join(" ") || "Failed to delete project.");
            else setApiError("Failed to delete project.");
        }
    };

    return { data, loading, apiError, navigate, submission };
};
