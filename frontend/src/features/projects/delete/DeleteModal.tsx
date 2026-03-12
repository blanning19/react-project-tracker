/**
 * @file Delete confirmation modal for a project.
 *
 * Shown when the user clicks Delete on a project row. Fires the delete
 * mutation and — on success — invalidates the project list cache so the
 * home page refreshes automatically.
 *
 * @module projects/delete/DeleteModal
 */

import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Alert from "react-bootstrap/Alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProject, projectKeys } from "../models/project.api";
import { getApiErrorMessage } from "../shared/getApiErrorMessage";

/**
 * Props for {@link DeleteModal}.
 */
export interface DeleteModalProps {
    /** Numeric ID of the project to delete. */
    projectId: number;
    /** Display name of the project — shown in the confirmation copy. */
    projectName: string;
    /** Called when the modal should close (Cancel button or backdrop click). */
    onCancel: () => void;
    /**
     * Called after a successful delete **and** cache invalidation.
     *
     * The parent should use this to close the modal and clear `deleteTarget`
     * state. It must NOT trigger a second cache invalidation — `DeleteModal`
     * already owns that responsibility via `queryClient.invalidateQueries`.
     *
     * FIX #14: Previously `onDeleted` was wired to `getData()` in
     * `useHomeController`, causing a double invalidation. Wire it to
     * `onDeleteCancel` instead so only one invalidation fires per delete.
     */
    onDeleted: () => void;
}

/**
 * Confirmation modal that deletes a project when the user clicks "Delete".
 *
 * ### Error display (Fix #10)
 * The error shown in the modal is extracted from `deleteMutation.error`
 * using `getApiErrorMessage`. Previously the modal showed a hardcoded
 * "Something went wrong." string regardless of what the API returned.
 * Now it surfaces field-level messages and HTTP status codes consistently
 * with the project form pages.
 *
 * ### Cache invalidation (Fix #14)
 * `onSuccess` invalidates `projectKeys.lists()` directly. Callers must not
 * perform a second invalidation in `onDeleted` — doing so causes two
 * back-to-back list fetches.
 *
 * @param props - See {@link DeleteModalProps}.
 */
function DeleteModal({
    projectId,
    projectName,
    onCancel,
    onDeleted,
}: DeleteModalProps): JSX.Element {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: () => deleteProject(projectId),

        onSuccess: async () => {
            // Single cache invalidation — the caller must not invalidate again.
            await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
            onDeleted();
        },
    });

    /**
     * FIX #10: Use getApiErrorMessage to surface the actual API error rather
     * than a hardcoded fallback. Handles DRF validation bodies, detail strings,
     * and plain HTTP status codes consistently with the project form.
     */
    const errorMessage = deleteMutation.error
        ? getApiErrorMessage(deleteMutation.error, "Something went wrong.")
        : "";

    return (
        <Modal show onHide={onCancel} centered aria-labelledby="delete-modal-title">
            <Modal.Header closeButton>
                <Modal.Title id="delete-modal-title">Delete project</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {errorMessage && (
                    <Alert variant="danger">{errorMessage}</Alert>
                )}
                <p>
                    Are you sure you want to delete <strong>{projectName}</strong>?
                    This action cannot be undone.
                </p>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={deleteMutation.isPending}
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                >
                    {deleteMutation.isPending ? "Deleting…" : "Delete"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default DeleteModal;
