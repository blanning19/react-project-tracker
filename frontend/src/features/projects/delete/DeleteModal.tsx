import { useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import { AlertTriangle } from "lucide-react";
import FetchInstance from "../../../shared/http/fetchClient";
import { API } from "../../../shared/api/routes";

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
 *   onDeleted   — called after a successful delete; caller should refresh data
 */
export default function DeleteModal({
    projectId,
    projectName,
    show,
    onHide,
    onDeleted,
}: DeleteModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);
        try {
            await FetchInstance.delete(`${API.projects}${projectId}/`);
            onDeleted();
            onHide();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleHide = () => {
        if (loading) return; // prevent close while in flight
        setError(null);
        onHide();
    };

    return (
        <Modal show={show} onHide={handleHide} centered size="sm" backdrop={loading ? "static" : true}>
            <Modal.Header closeButton={!loading}>
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

                {error && (
                    <div className="alert alert-danger py-2 px-3 mt-3 mb-0" style={{ fontSize: "0.83rem" }}>
                        {error}
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleHide}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={handleConfirm}
                    disabled={loading}
                    className="d-flex align-items-center gap-2"
                >
                    {loading && <Spinner size="sm" />}
                    {loading ? "Deleting…" : "Delete"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
