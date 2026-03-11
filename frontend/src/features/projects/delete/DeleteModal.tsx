/**
 * @file Inline delete confirmation modal for the Home page.
 *
 * @module projects/delete/DeleteModal
 */

import { Button, Modal, Spinner } from "react-bootstrap";
import { AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProject, projectKeys } from "../../../features/projects/models/project.api";

/**
 * Props for {@link DeleteModal}.
 */
export interface DeleteModalProps {
    /** Numeric ID of the project to delete. */
    projectId: number;
    /** Shown in the confirmation prompt so the user can verify the right record. */
    projectName: string;
    /** Controls modal visibility. Pass `true` to open, `false` to close. */
    show: boolean;
    /** Called when the user cancels or closes the modal without deleting. */
    onHide: () => void;
    /**
     * Called after a successful delete and cache invalidation.
     * The caller can use this to perform any additional UI-specific cleanup.
     */
    onDeleted: () => void;
}

/**
 * Inline delete confirmation modal.
 *
 * Replaces the previous `/delete/:id` route. Trigger this from `HomeView` by
 * storing `{ id, name }` in a piece of state and passing it here.
 *
 * Uses a React Query mutation rather than component-local `async` state so
 * pending and error handling stay aligned with the rest of the app's data layer.
 * On success the modal invalidates all project list queries before notifying
 * the caller via `onDeleted`.
 *
 * The modal blocks closure while the deletion is in-flight (`backdrop="static"`,
 * close button hidden) to prevent double-delete or a premature UI reset.
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
