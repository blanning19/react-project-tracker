/**
 * @file Pure presentational component for the Home (project list) page.
 *
 * @module home/HomeView
 *
 * Corrections applied from tsc errors:
 * - `../../shared/types` does not resolve → import ProjectRecord from
 *   the projects feature directly (shared barrel not yet on disk)
 * - `DeleteTarget` / `HomeNavigationProps` not in home.types → DeleteTarget
 *   imported from useHomeController; nav callbacks typed inline
 * - `HOME_SORT_LABELS` not in home.constants → removed; column labels inlined
 * - `"modified"` not in HomeSortKey → removed from SortTh usage; adjust once
 *   HomeSortKey values are confirmed from your real home.types
 * - `onCreateClick` / `onEditClick` not in HomeNavigationProps → typed inline
 */

import type { ProjectRecord } from "../projects/models/project.types";
import type { HomeSortKey } from "./home.types";
import type { DeleteTarget } from "./useHomeController";

export interface HomeViewProps {
    projects: ProjectRecord[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    loading: boolean;
    apiError: string;
    successMessage: string;
    search: string;
    statusFilter: string;
    sortKey: HomeSortKey;
    sortDesc: boolean;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
    onSortChange: (key: HomeSortKey) => void;
    onPageChange: (page: number) => void;
    onDeleteClick: (target: DeleteTarget) => void;
    onRetry: () => Promise<void>;
    deleteTarget: DeleteTarget;
    onDeleteCancel: () => void;
    onDeleteConfirm: () => void;
    deleteError: string;
    deleteLoading: boolean;
    onCreateClick: () => void;
    onEditClick: (id: number) => void;
}

function SortIndicator({
    columnKey,
    activeSortKey,
    sortDesc,
}: {
    columnKey: HomeSortKey;
    activeSortKey: HomeSortKey;
    sortDesc: boolean;
}) {
    if (columnKey !== activeSortKey) return <span className="sort-indicator inactive">⇅</span>;
    return <span className="sort-indicator active">{sortDesc ? "↓" : "↑"}</span>;
}

function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US", { dateStyle: "medium" });
}

// Inline column labels — HOME_SORT_LABELS is not exported by home.constants.
// Replace these strings with your real labels or add HOME_SORT_LABELS to
// home.constants and re-import it.
const SORT_LABELS: Record<HomeSortKey, string> = {
    name:           "Name",
    status:         "Status",
    comments:       "Comments",
    start_date:     "Start date",
    end_date:       "End date",
    security_level: "Security level",
};

function HomeView({
    projects,
    totalCount,
    currentPage,
    pageSize,
    loading,
    apiError,
    successMessage,
    search,
    statusFilter,
    sortKey,
    sortDesc,
    onSearchChange,
    onStatusFilterChange,
    onSortChange,
    onPageChange,
    onDeleteClick,
    onRetry,
    deleteTarget,
    onDeleteCancel,
    onDeleteConfirm,
    deleteError,
    deleteLoading,
    onCreateClick,
    onEditClick,
}: HomeViewProps): JSX.Element {
    const totalPages = Math.ceil(totalCount / pageSize);

    const SortTh = ({ colKey, children }: { colKey: HomeSortKey; children: React.ReactNode }) => (
        <th
            role="button"
            onClick={() => onSortChange(colKey)}
            className={`sortable-header${sortKey === colKey ? " active-sort" : ""}`}
        >
            {children}{" "}
            <SortIndicator columnKey={colKey} activeSortKey={sortKey} sortDesc={sortDesc} />
        </th>
    );

    return (
        <div className="home-page">
            {successMessage && (
                <div className="alert alert-success alert-dismissible">
                    {successMessage}
                </div>
            )}

            {apiError && (
                <div className="alert alert-danger">
                    {apiError}{" "}
                    <button className="btn btn-link btn-sm" onClick={() => void onRetry()}>
                        Retry
                    </button>
                </div>
            )}

            <div className="d-flex gap-2 mb-3 align-items-center flex-wrap">
                <input
                    type="text"
                    className="form-control w-auto"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                <select
                    className="form-select w-auto"
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                >
                    <option value="">All statuses</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <button className="btn btn-primary ms-auto" onClick={onCreateClick}>
                    + New project
                </button>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading…</span>
                    </div>
                </div>
            ) : (
                <table className="table table-hover">
                    <thead>
                        <tr>
                            {(Object.keys(SORT_LABELS) as HomeSortKey[]).map((key) => (
                                <SortTh key={key} colKey={key}>{SORT_LABELS[key]}</SortTh>
                            ))}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.length === 0 ? (
                            <tr>
                                <td colSpan={Object.keys(SORT_LABELS).length + 1}
                                    className="text-center text-muted py-4">
                                    No projects found.
                                </td>
                            </tr>
                        ) : (
                            projects.map((project) => (
                                <tr key={project.id}>
                                    <td>{project.name}</td>
                                    <td>{project.status ?? "—"}</td>
                                    <td>{project.comments ?? "—"}</td>
                                    <td>{formatDate(project.start_date)}</td>
                                    <td>{formatDate(project.end_date)}</td>
                                    <td>{project.security_level}</td>
                                    <td>
                                        <button
                                            className="btn btn-outline-secondary btn-sm me-1"
                                            onClick={() => onEditClick(project.id)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() =>
                                                onDeleteClick({ id: project.id, name: project.name })
                                            }
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {totalPages > 1 && (
                <nav>
                    <ul className="pagination justify-content-center">
                        <li className={`page-item${currentPage === 1 ? " disabled" : ""}`}>
                            <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>
                                Previous
                            </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <li key={page} className={`page-item${page === currentPage ? " active" : ""}`}>
                                <button className="page-link" onClick={() => onPageChange(page)}>
                                    {page}
                                </button>
                            </li>
                        ))}
                        <li className={`page-item${currentPage === totalPages ? " disabled" : ""}`}>
                            <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>
                                Next
                            </button>
                        </li>
                    </ul>
                </nav>
            )}

            {deleteTarget && (
                <div className="modal show d-block" role="dialog" aria-modal="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete project</h5>
                                <button type="button" className="btn-close" onClick={onDeleteCancel} />
                            </div>
                            <div className="modal-body">
                                {deleteError && (
                                    <div className="alert alert-danger">{deleteError}</div>
                                )}
                                <p>
                                    Are you sure you want to delete{" "}
                                    <strong>{deleteTarget.name}</strong>? This cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={onDeleteCancel}
                                    disabled={deleteLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={onDeleteConfirm}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? "Deleting…" : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HomeView;
