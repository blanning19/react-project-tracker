import type { Dispatch, SetStateAction } from "react";
import Dayjs from "dayjs";
import { Link } from "react-router-dom";
import { Alert, Button, Container, Form, Spinner, Table } from "react-bootstrap";
import type { ProjectRecord } from "../projects/models/project.types";
import type { HomeSortKey, HomeStatusFilter } from "./home.types";

interface HomeViewProps {
    loading: boolean;
    apiError: string;
    total: number;
    totalPages: number;
    safePage: number;
    start: number;
    end: number;
    pageSize: number;
    pageRows: ProjectRecord[];
    searchTerm: string;
    statusFilter: HomeStatusFilter;
    hasActiveFilters: boolean;
    sortIcon: (key: HomeSortKey) => string;
    getData: () => Promise<void>;
    setPage: Dispatch<SetStateAction<number>>;
    setPageSize: Dispatch<SetStateAction<number>>;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: HomeStatusFilter) => void;
    toggleSort: (key: HomeSortKey) => void;
}

function SortHeader({
    label,
    sortKey,
    onSort,
    icon,
}: {
    label: string;
    sortKey: HomeSortKey;
    onSort: (key: HomeSortKey) => void;
    icon: string;
}): JSX.Element {
    return (
        <button
            type="button"
            className="btn btn-link p-0 text-decoration-none text-reset fw-semibold"
            onClick={() => onSort(sortKey)}
        >
            {label}
            {icon}
        </button>
    );
}

function HomeView({
    loading,
    apiError,
    total,
    totalPages,
    safePage,
    start,
    end,
    pageSize,
    pageRows,
    searchTerm,
    statusFilter,
    hasActiveFilters,
    sortIcon,
    getData,
    setPage,
    setPageSize,
    onSearchChange,
    onStatusFilterChange,
    toggleSort,
}: HomeViewProps): JSX.Element {
    const visibleEnd = Math.min(end, total);

    return (
        <Container className="py-4">
            <div className="px-3 py-2 mb-3 bg-body-tertiary border rounded">
                <div className="d-flex align-items-center justify-content-between">
                    <strong>Projects</strong>
                    <Button as={Link} to="/create" variant="primary" size="sm">
                        + Create
                    </Button>
                </div>
            </div>

            {apiError && (
                <Alert variant="danger" className="fw-bold">
                    {apiError}
                    <Button
                        variant="outline-light"
                        size="sm"
                        className="ms-2"
                        onClick={getData}
                    >
                        Retry
                    </Button>
                </Alert>
            )}

            {loading ? (
                <div className="d-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" />
                    <span>Loading projects...</span>
                </div>
            ) : (
                <>
                    {/*
                        Search and filter toolbar.
                     */}
                    <div className="d-flex flex-column flex-md-row gap-3 align-items-md-end justify-content-between mb-3">
                        <div className="d-flex flex-column flex-md-row gap-3">
                            <Form.Group>
                                <Form.Label className="small text-body-secondary mb-1">
                                    Search
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Search name or comments"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        onSearchChange(e.target.value);
                                    }}
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="small text-body-secondary mb-1">
                                    Status
                                </Form.Label>
                                <Form.Select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        onStatusFilterChange(e.target.value as HomeStatusFilter);
                                    }}
                                >
                                    <option value="All">All</option>
                                    <option value="Open">Open</option>
                                    <option value="In progress">In progress</option>
                                    <option value="Completed">Completed</option>
                                </Form.Select>
                            </Form.Group>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <div className="small text-body-secondary">Rows:</div>

                            <select
                                className="form-select form-select-sm"
                                style={{ width: 90 }}
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                            >
                                {[5, 10, 20, 50].map((count) => (
                                    <option key={count} value={count}>
                                        {count}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="text-body-secondary small">
                            Showing {total === 0 ? 0 : start + 1}-{visibleEnd} of {total}
                        </div>
                    </div>

                    <div className="table-responsive border rounded">
                        <Table striped hover responsive className="mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="text-nowrap">
                                        <SortHeader
                                            label="Name"
                                            sortKey="name"
                                            onSort={toggleSort}
                                            icon={sortIcon("name")}
                                        />
                                    </th>
                                    <th className="text-nowrap">
                                        <SortHeader
                                            label="Status"
                                            sortKey="status"
                                            onSort={toggleSort}
                                            icon={sortIcon("status")}
                                        />
                                    </th>
                                    <th className="text-nowrap">
                                        <SortHeader
                                            label="Comments"
                                            sortKey="comments"
                                            onSort={toggleSort}
                                            icon={sortIcon("comments")}
                                        />
                                    </th>
                                    <th className="text-nowrap">
                                        <SortHeader
                                            label="Start date"
                                            sortKey="start_date"
                                            onSort={toggleSort}
                                            icon={sortIcon("start_date")}
                                        />
                                    </th>
                                    <th className="text-nowrap">
                                        <SortHeader
                                            label="End date"
                                            sortKey="end_date"
                                            onSort={toggleSort}
                                            icon={sortIcon("end_date")}
                                        />
                                    </th>
                                    <th className="text-nowrap" style={{ width: 190 }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {pageRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-body-secondary py-4">
                                            {hasActiveFilters
                                                ? "No projects match your current search or filters."
                                                : "No projects yet. Create your first project."}
                                        </td>
                                    </tr>
                                ) : (
                                    pageRows.map((row) => (
                                        <tr key={row.id}>
                                            <td className="fw-semibold">{row.name ?? ""}</td>
                                            <td>{row.status ?? ""}</td>
                                            <td style={{ maxWidth: 520, whiteSpace: "normal" }}>
                                                {row.comments ?? ""}
                                            </td>
                                            <td className="text-nowrap">
                                                {row.start_date
                                                    ? Dayjs(row.start_date).format("MM-DD-YYYY")
                                                    : ""}
                                            </td>
                                            <td className="text-nowrap">
                                                {row.end_date
                                                    ? Dayjs(row.end_date).format("MM-DD-YYYY")
                                                    : ""}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        as={Link}
                                                        to={`/edit/${row.id}`}
                                                        variant="outline-secondary"
                                                        size="sm"
                                                    >
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        as={Link}
                                                        to={`/delete/${row.id}`}
                                                        variant="outline-danger"
                                                        size="sm"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mt-3">
                        <div className="small text-body-secondary">
                            Page {safePage} of {totalPages}
                        </div>

                        <div className="btn-group" role="group" aria-label="Pagination">
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                disabled={safePage <= 1}
                                onClick={() => setPage(1)}
                            >
                                « First
                            </button>

                            <button
                                className="btn btn-outline-secondary btn-sm"
                                disabled={safePage <= 1}
                                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                            >
                                ‹ Prev
                            </button>

                            <button
                                className="btn btn-outline-secondary btn-sm"
                                disabled={safePage >= totalPages}
                                onClick={() =>
                                    setPage((currentPage) => Math.min(totalPages, currentPage + 1))
                                }
                            >
                                Next ›
                            </button>

                            <button
                                className="btn btn-outline-secondary btn-sm"
                                disabled={safePage >= totalPages}
                                onClick={() => setPage(totalPages)}
                            >
                                Last »
                            </button>
                        </div>
                    </div>
                </>
            )}
        </Container>
    );
}

export default HomeView;