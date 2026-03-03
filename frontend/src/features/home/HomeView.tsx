import type { Dispatch, SetStateAction } from "react";
import Dayjs from "dayjs";
import { Link } from "react-router-dom";
import { Alert, Badge, Button, Container, Form, Pagination, Spinner, Table } from "react-bootstrap";
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
    refreshing: boolean;
    searchTerm: string;
    statusFilter: HomeStatusFilter;
    hasActiveFilters: boolean;
    sortIcon: (key: HomeSortKey) => string;
    getData: (options?: { isRefresh?: boolean }) => Promise<void>;
    setPage: Dispatch<SetStateAction<number>>;
    setPageSize: Dispatch<SetStateAction<number>>;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: HomeStatusFilter) => void;
    toggleSort: (key: HomeSortKey) => void;
}

/**
 * Renders a compact sortable table header button.
 * This keeps the header clickable without making it look like a full action button.
 */
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

/**
 * Maps each project status to a Bootstrap badge variant.
 * This gives the Status column more visual scanning value than plain text alone.
 */
function getStatusBadgeVariant(status: string | null | undefined): string {
    switch (status) {
        case "Completed":
            return "success";
        case "In progress":
            return "warning";
        case "Open":
            return "primary";
        default:
            return "secondary";
    }
}

/**
 * Builds a compact page list for the pagination control.
 * The result always favors a small, readable page window with ellipses when needed.
 */
function getVisiblePages(
    currentPage: number,
    totalPages: number
): Array<number | "ellipsis-left" | "ellipsis-right"> {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    // Near the beginning, show the first few pages and the last page.
    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
    }

    // Near the end, show the first page and the last few pages.
    if (currentPage >= totalPages - 3) {
        return [1, "ellipsis-left", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    // In the middle, show the current page with one neighbor on each side.
    return [
        1,
        "ellipsis-left",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis-right",
        totalPages,
    ];
}

function HomeView({
    loading,
    refreshing,
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
    // Prevent the visible range from exceeding the total record count.
    const visibleEnd = Math.min(end, total);

    /**
     * Updates the selected page size and resets the user back to page 1.
     * Resetting avoids invalid page positions after the page size changes.
     */
    const onPageSizeChange = (value: number) => {
        setPageSize(value);
        setPage(1);
    };

    return (
        <Container className="py-4">
            {/* Top page header with title and primary create action. */}
            <div className="px-3 py-2 mb-3 bg-body-tertiary border rounded">
                <div className="d-flex align-items-center justify-content-between">
                    <strong>Projects</strong>
                    <Button as={Link} to="/create" variant="primary" size="sm">+ Create</Button>
                </div>
            </div>

            {/* Error banner with a retry action for failed data loads. */}
            {apiError && (
                <Alert variant="danger" className="fw-bold">
                    {apiError}
                    <Button
                        variant="outline-light"
                        size="sm"
                        className="ms-2"
                        onClick={() => {
                            void getData({ isRefresh: true });
                        }}
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
                    {/* Search, filter, and page-size controls for the table. */}
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
                                    onPageSizeChange(Number(e.target.value));
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

                    {/* Responsive table wrapper with a small in-place refresh indicator. */}
                    <div className="table-responsive border rounded">
                        {refreshing && (
                            <div className="d-flex align-items-center gap-2 small text-body-secondary p-2 border-bottom">
                                <Spinner animation="border" size="sm" />
                                <span>Refreshing projects...</span>
                            </div>
                        )}

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

                                    {/* Narrower actions column because the row now uses a compact action layout. */}
                                    <th className="text-nowrap" style={{ width: 170 }}>
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

                                            <td>
                                                <Badge bg={getStatusBadgeVariant(row.status)}>{row.status ?? ""}</Badge>
                                            </td>

                                            <td style={{ maxWidth: 520, whiteSpace: "normal" }}>{row.comments ?? ""}</td>

                                            <td className="text-nowrap">
                                                {row.start_date ? Dayjs(row.start_date).format("MM-DD-YYYY") : ""}
                                            </td>

                                            <td className="text-nowrap">
                                                {row.end_date ? Dayjs(row.end_date).format("MM-DD-YYYY") : ""}
                                            </td>

                                            {/* Use one primary visible action and move destructive actions into a menu. */}
                                            <td className="text-nowrap">
                                                <div className="d-flex align-items-center gap-2">
                                                    <Button
                                                        as={Link}
                                                        to={`/edit/${row.id}`}
                                                        variant="outline-primary"
                                                        size="sm"
                                                        title={`Edit ${row.name ?? "project"}`}
                                                    >
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        as={Link}
                                                        to={`/delete/${row.id}`}
                                                        variant="outline-danger"
                                                        size="sm"
                                                        title={`Delete ${row.name ?? "project"}`}
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

                    {/* Footer area with record range text and a more modern numbered pagination control. */}
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mt-3">
                        <div className="small text-body-secondary">
                            Showing {total === 0 ? 0 : start + 1}-{visibleEnd} of {total}
                        </div>

                        <Pagination className="mb-0">
                            <Pagination.First disabled={safePage <= 1} onClick={() => setPage(1)} />

                            <Pagination.Prev
                                disabled={safePage <= 1}
                                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                            />

                            {getVisiblePages(safePage, totalPages).map((item, index) => {
                                if (item === "ellipsis-left" || item === "ellipsis-right") {
                                    return <Pagination.Ellipsis key={`${item}-${index}`} disabled />;
                                }

                                return (
                                    <Pagination.Item
                                        key={item}
                                        active={item === safePage}
                                        onClick={() => setPage(item)}
                                    >
                                        {item}
                                    </Pagination.Item>
                                );
                            })}

                            <Pagination.Next
                                disabled={safePage >= totalPages}
                                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                            />

                            <Pagination.Last
                                disabled={safePage >= totalPages}
                                onClick={() => setPage(totalPages)}
                            />
                        </Pagination>
                    </div>
                </>
            )}
        </Container>
    );
}

export default HomeView;