import { Button, Modal, Spinner } from "react-bootstrap";
import { AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProject, projectKeys } from "../../../features/projects/models/project.api";

interface DeleteModalProps {
    projectId: number;
    projectName: string;
    show: boolean;
    onHide: () => void;
    onDeleted: () => void;
}

/**
 * Inline delete confirmation modal.
 *
 * Replaces the separate /delete/:id route. Trigger this from HomeView by
 * storing { id, name } in a piece of state and passing it here.
 *
 * Props:
 *   projectId   — numeric ID of the project to delete
 *   projectName — shown in the confirmation prompt
 *   show        — controls modal visibility
 *   onHide      — called when the user cancels or closes
 *   onDeleted   — called after a successful delete; caller can perform any
 *                 UI-specific cleanup after the cache refresh completes
 *
 * REMARK:
 * Delete now uses a React Query mutation instead of component-local async state.
 * This keeps pending/error handling aligned with the rest of the app's data layer.
 */
export default function DeleteModal({
    projectId,
    projectName,
    show,
    onHide,
    onDeleted,
}: DeleteModalProps) {
    // REMARK: Added queryClient so delete can invalidate cached project lists.
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async () => deleteProject(projectId),

        onSuccess: async () => {
            // REMARK: Refresh all project list queries after a delete.
            await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

            onDeleted();
            onHide();
        },
    });

    const handleConfirm = async () => {
        await deleteMutation.mutateAsync();
    };

    const handleHide = () => {
        if (deleteMutation.isPending) return; // prevent close while in flight
        deleteMutation.reset();
        onHide();
    };

    return (
        <Modal
            show={show}
            onHide={handleHide}
            centered
            size="sm"
            backdrop={deleteMutation.isPending ? "static" : true}
        >
            <Modal.Header closeButton={!deleteMutation.isPending}>
                <Modal.Title className="d-flex align-items-center gap-2 fs-6">
                    <AlertTriangle size={18} strokeWidth={2} className="text-danger" />
                    Delete project
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                    Are you sure you want to delete{" "}
                    <strong className="text-break">{projectName}</strong>?
                    This action cannot be undone.
                </p>

                {deleteMutation.isError && (
                    <div
                        className="alert alert-danger py-2 px-3 mt-3 mb-0"
                        style={{ fontSize: "0.83rem" }}
                    >
                        Something went wrong. Please try again.
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleHide}
                    disabled={deleteMutation.isPending}
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => void handleConfirm()}
                    disabled={deleteMutation.isPending}
                    className="d-flex align-items-center gap-2"
                >
                    {deleteMutation.isPending && <Spinner size="sm" />}
                    {deleteMutation.isPending ? "Deleting…" : "Delete"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}