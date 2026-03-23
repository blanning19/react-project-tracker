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

function getStatusBadgeClass(status: string | null | undefined): string {
    switch (status) {
        case "Active":
            return "bg-success-subtle text-success-emphasis border border-success-subtle";
        case "On Hold":
            return "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
        case "Completed":
            return "bg-primary-subtle text-primary-emphasis border border-primary-subtle";
        case "Cancelled":
            return "bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle";
        default:
            return "bg-light text-dark border";
    }
}

function renderStatusPill(status: string | null | undefined): JSX.Element | string {
    if (!status) return "—";

    return (
        <span className={`badge rounded-pill fw-semibold px-3 py-2 ${getStatusBadgeClass(status)}`}>
            {status}
        </span>
    );
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
            <span className="d-inline-flex align-items-center gap-1">
                {children}
                <SortIndicator
                    columnKey={colKey}
                    activeSortKey={sort.key}
                    sortDesc={sort.dir === "desc"}
                />
            </span>
        </th>
    );

    return (
        <div className="dashboard-page container-fluid px-3 px-lg-4 py-4">
            <div className="dashboard-shell mx-auto">
                <section className="dashboard-hero mb-4">
                    <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-lg-between gap-3">
                        <div>
                            <div className="dashboard-eyebrow">Projects</div>

                            <h1 className="dashboard-title mb-2">
                                Project tracker
                            </h1>

                            <p className="dashboard-subtitle mb-0">
                                View, search, sort, and manage your tracked projects.
                            </p>
                        </div>

                        <button
                            className="dashboard-action-link dashboard-action-link-strong"
                            onClick={navigation.onNavigateCreate}
                            type="button"
                        >
                            + New project
                        </button>
                    </div>
                </section>

                <section className="dashboard-card">
                    {state.successMessage && (
                        <div className="alert alert-success mb-4" role="alert">
                            {state.successMessage}
                        </div>
                    )}

                    {state.apiError && (
                        <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-4" role="alert">
                            <span>{state.apiError}</span>

                            <button className="btn btn-sm btn-outline-danger" onClick={() => void actions.getData()}>
                                Retry
                            </button>
                        </div>
                    )}

                    <div className="dashboard-filter-bar mb-4">
                        <div className="row g-3 align-items-end">
                            <div className="col-12 col-md-6 col-xl-4">
                                <label className="dashboard-filter-label">Search</label>
                                <input
                                    type="text"
                                    className="form-control dashboard-form-control"
                                    placeholder="Search projects..."
                                    value={filters.searchTerm}
                                    onChange={(e) => filters.onSearchChange(e.target.value)}
                                />
                            </div>

                            <div className="col-12 col-md-6 col-xl-3">
                                <label className="dashboard-filter-label">Status</label>
                                <select
                                    className="form-select dashboard-form-control"
                                    value={filters.statusFilter}
                                    onChange={(e) => filters.onStatusFilterChange(e.target.value as HomeStatusFilter)}
                                >
                                    {HOME_STATUS_FILTER_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {state.loading ? (
                        <div className="d-flex justify-content-center py-5">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table align-middle mb-0 dashboard-table">
                                <thead className="pt-table-header">
                                    <tr>
                                        {(Object.keys(HOME_SORT_LABELS) as HomeSortKey[]).map((key) => (
                                            <SortTh key={key} colKey={key}>
                                                {HOME_SORT_LABELS[key]}
                                            </SortTh>
                                        ))}
                                        <th className="text-nowrap">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={Object.keys(HOME_SORT_LABELS).length + 1}
                                                className="text-center text-muted py-5"
                                            >
                                                No projects found.
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((project) => (
                                            <tr key={project.id}>
                                                <td>{project.name}</td>
                                                <td>{renderStatusPill(project.status)}</td>
                                                <td>{project.comments ?? "—"}</td>
                                                <td>{formatDate(project.start_date)}</td>
                                                <td>{formatDate(project.end_date)}</td>
                                                <td>{project.security_level ?? "—"}</td>
                                                <td>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => navigation.onNavigateEdit(project.id)}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() =>
                                                                navigation.onDeleteRequest({
                                                                    id: project.id,
                                                                    name: project.name,
                                                                })
                                                            }
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <nav className="mt-4">
                            <ul className="pagination justify-content-center mb-0">
                                <li className={`page-item${pagination.page === 1 ? " disabled" : ""}`}>
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

                                <li className={`page-item${pagination.page === totalPages ? " disabled" : ""}`}>
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
                </section>

                {navigation.deleteTarget && (
                    <div className="modal show d-block" role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered">
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

                                    <p className="mb-0">
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
                                        {state.deleteLoading ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HomeView;