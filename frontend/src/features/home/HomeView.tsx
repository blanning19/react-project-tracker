/**
 * @file Pure presentational component for the Home (project list) page.
 *
 * @module home/HomeView
 */

import { HOME_STATUS_FILTER_OPTIONS, HOME_SORT_LABELS } from "./home.constants";
import type { HomeSortKey, HomeViewProps, HomeStatusFilter } from "./home.types";

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

    const dateValue = new Date(value);

    return isNaN(dateValue.getTime())
        ? value
        : dateValue.toLocaleDateString("en-US", { dateStyle: "medium" });
}

function HomeView({
    rows,
    pagination,
    sort,
    filters,
    state,
    actions,
    navigation,
}: HomeViewProps): JSX.Element {
    const totalPages = pagination.totalPages;

    const SortTh = ({
        colKey,
        children,
    }: {
        colKey: HomeSortKey;
        children: React.ReactNode;
    }) => (
        <th
            role="button"
            onClick={() => sort.toggleSort(colKey)}
            className={`sortable-header${sort.key === colKey ? " active-sort" : ""}`}
        >
            {children}{" "}
            <SortIndicator
                columnKey={colKey}
                activeSortKey={sort.key}
                sortDesc={sort.dir === "desc"}
            />
        </th>
    );

    return (
        <div className="home-page">
            {state.successMessage && (
                <div className="alert alert-success alert-dismissible">
                    {state.successMessage}
                </div>
            )}

            {state.apiError && (
                <div className="alert alert-danger">
                    {state.apiError}{" "}
                    <button className="btn btn-link btn-sm" onClick={() => void actions.getData()}>
                        Retry
                    </button>
                </div>
            )}

            <div className="d-flex gap-2 mb-3 align-items-center flex-wrap">
                <input
                    type="text"
                    className="form-control w-auto"
                    placeholder="Search…"
                    value={filters.searchTerm}
                    onChange={(e) => filters.onSearchChange(e.target.value)}
                />

                <select
                    className="form-select w-auto"
                    value={filters.statusFilter}
                    onChange={(e) => filters.onStatusFilterChange(e.target.value as HomeStatusFilter)}
                >
                    {HOME_STATUS_FILTER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>

                <button className="btn btn-primary ms-auto" onClick={navigation.onNavigateCreate}>
                    + New project
                </button>
            </div>

            {state.loading ? (
                <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading…</span>
                    </div>
                </div>
            ) : (
                <table className="table table-hover">
                    <thead>
                        <tr>
                            {(Object.keys(HOME_SORT_LABELS) as HomeSortKey[]).map((key) => (
                                <SortTh key={key} colKey={key}>
                                    {HOME_SORT_LABELS[key]}
                                </SortTh>
                            ))}
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={Object.keys(HOME_SORT_LABELS).length + 1}
                                    className="text-center text-muted py-4"
                                >
                                    No projects found.
                                </td>
                            </tr>
                        ) : (
                            rows.map((project) => (
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
                                            onClick={() => navigation.onNavigateEdit(project.id)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() =>
                                                navigation.onDeleteRequest({
                                                    id: project.id,
                                                    name: project.name,
                                                })
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
                        <li
                            className={`page-item${pagination.page === 1 ? " disabled" : ""}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => pagination.onPageChange(pagination.page - 1)}
                            >
                                Previous
                            </button>
                        </li>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <li
                                key={page}
                                className={`page-item${page === pagination.page ? " active" : ""}`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => pagination.onPageChange(page)}
                                >
                                    {page}
                                </button>
                            </li>
                        ))}

                        <li
                            className={`page-item${pagination.page === totalPages ? " disabled" : ""}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => pagination.onPageChange(pagination.page + 1)}
                            >
                                Next
                            </button>
                        </li>
                    </ul>
                </nav>
            )}

            {navigation.deleteTarget && (
                <div className="modal show d-block" role="dialog" aria-modal="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete project</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={navigation.onDeleteCancel}
                                />
                            </div>

                            <div className="modal-body">
                                {state.deleteError && (
                                    <div className="alert alert-danger">{state.deleteError}</div>
                                )}

                                <p>
                                    Are you sure you want to delete{" "}
                                    <strong>{navigation.deleteTarget.name}</strong>? This cannot be undone.
                                </p>
                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={navigation.onDeleteCancel}
                                    disabled={state.deleteLoading}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn btn-danger"
                                    onClick={() => void actions.onDeleteConfirm()}
                                    disabled={state.deleteLoading}
                                >
                                    {state.deleteLoading ? "Deleting…" : "Delete"}
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