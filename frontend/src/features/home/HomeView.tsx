import type { ReactNode } from "react";
import Dayjs from "dayjs";
import { Link } from "react-router-dom";
import { Alert, Badge, Button, Container, Form, Pagination, Spinner, Table } from "react-bootstrap";
import { HOME_PAGE_SIZE_OPTIONS, HOME_STATUS_FILTER_OPTIONS } from "./home.constants";
import type { ProjectRecord } from "../projects/models/project.types";
import type { HomeSortDirection, HomeSortKey, HomeStatusFilter, HomeViewProps } from "./home.types";

type AriaSortValue = "ascending" | "descending" | "none";

/**
 * Returns the correct aria-sort value for a sortable table column.
 * Screen readers use this to announce the active sort direction.
 */
function getAriaSortValue(
    activeSortKey: HomeSortKey,
    activeSortDir: HomeSortDirection,
    columnSortKey: HomeSortKey
): AriaSortValue {
    if (activeSortKey !== columnSortKey) {
        return "none";
    }

    return activeSortDir === "asc" ? "ascending" : "descending";
}

/**
 * Builds a clear screen-reader label for a sortable column button.
 * The label explains both the current state and what activating the button will do next.
 */
function getSortButtonAriaLabel(
    label: string,
    activeSortKey: HomeSortKey,
    activeSortDir: HomeSortDirection,
    columnSortKey: HomeSortKey
): string {
    if (activeSortKey !== columnSortKey) {
        return `Sort by ${label} ascending`;
    }

    return activeSortDir === "asc"
        ? `${label} sorted ascending. Activate to sort descending`
        : `${label} sorted descending. Activate to sort ascending`;
}

/**
 * Renders a compact sortable table header button.
 * This keeps the header clickable without making it look like a full action button.
 */
function SortHeader({
    label,
    sortKey,
    activeSortKey,
    activeSortDir,
    onSort,
    icon,
}: {
    label: string;
    sortKey: HomeSortKey;
    activeSortKey: HomeSortKey;
    activeSortDir: HomeSortDirection;
    onSort: (key: HomeSortKey) => void;
    icon: string;
}): JSX.Element {
    const isActive = activeSortKey === sortKey;
    const srStatus = !isActive ? "Not currently sorted" : activeSortDir === "asc" ? "Sorted ascending" : "Sorted descending";

    return (
        <button
            type="button"
            className="btn btn-link p-0 text-decoration-none text-reset fw-semibold"
            aria-label={getSortButtonAriaLabel(label, activeSortKey, activeSortDir, sortKey)}
            onClick={() => onSort(sortKey)}
        >
            <span>{label}</span>
            <span aria-hidden="true">{icon}</span>
            <span className="visually-hidden">. {srStatus}.</span>
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
function getVisiblePages(currentPage: number, totalPages: number): Array<number | "ellipsis-left" | "ellipsis-right"> {
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
    return [1, "ellipsis-left", currentPage - 1, currentPage, currentPage + 1, "ellipsis-right", totalPages];
}

/**
 * Small reusable row for the mobile project card layout.
 * Keeps labels consistent and visually compact on narrow screens.
 */
function MobileField({
    label,
    value,
}: {
    label: string;
    value: ReactNode;
}): JSX.Element {
    return (
        <div className="mb-2">
            <div className="small text-body-secondary">{label}</div>
            <div>{value}</div>
        </div>
    );
}

/**
 * Mobile-friendly project card used on smaller screens where a table becomes cramped.
 */
function ProjectMobileCard({ row }: { row: ProjectRecord }): JSX.Element {
    return (
        <div className="border rounded p-3 mb-3 bg-body">
            <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                <div className="fw-semibold fs-6">{row.name ?? ""}</div>
                <Badge bg={getStatusBadgeVariant(row.status)}>{row.status ?? ""}</Badge>
            </div>

            <MobileField label="Comments" value={row.comments ?? ""} />
            <MobileField label="Start date" value={row.start_date ? Dayjs(row.start_date).format("MM-DD-YYYY") : ""} />
            <MobileField label="End date" value={row.end_date ? Dayjs(row.end_date).format("MM-DD-YYYY") : ""} />

            <div className="d-flex align-items-center gap-2 pt-2">
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
        </div>
    );
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
    sortKey,
    sortDir,
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
                                <Form.Label className="small text-body-secondary mb-1">Search</Form.Label>

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
                                <Form.Label className="small text-body-secondary mb-1">Status</Form.Label>

                                <Form.Select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        onStatusFilterChange(e.target.value as HomeStatusFilter);
                                    }}
                                >
                                    {HOME_STATUS_FILTER_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
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
                                {HOME_PAGE_SIZE_OPTIONS.map((count) => (
                                    <option key={count} value={count}>
                                        {count}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Desktop/tablet table layout. */}
                    <div className="d-none d-md-block">
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
                                        <th scope="col" className="text-nowrap" aria-sort={getAriaSortValue(sortKey, sortDir, "name")}>
                                            <SortHeader
                                                label="Name"
                                                sortKey="name"
                                                activeSortKey={sortKey}
                                                activeSortDir={sortDir}
                                                onSort={toggleSort}
                                                icon={sortIcon("name")}
                                            />
                                        </th>

                                        <th scope="col" className="text-nowrap" aria-sort={getAriaSortValue(sortKey, sortDir, "status")}>
                                            <SortHeader
                                                label="Status"
                                                sortKey="status"
                                                activeSortKey={sortKey}
                                                activeSortDir={sortDir}
                                                onSort={toggleSort}
                                                icon={sortIcon("status")}
                                            />
                                        </th>

                                        <th scope="col" className="text-nowrap" aria-sort={getAriaSortValue(sortKey, sortDir, "comments")}>
                                            <SortHeader
                                                label="Comments"
                                                sortKey="comments"
                                                activeSortKey={sortKey}
                                                activeSortDir={sortDir}
                                                onSort={toggleSort}
                                                icon={sortIcon("comments")}
                                            />
                                        </th>

                                        <th scope="col" className="text-nowrap" aria-sort={getAriaSortValue(sortKey, sortDir, "start_date")}>
                                            <SortHeader
                                                label="Start date"
                                                sortKey="start_date"
                                                activeSortKey={sortKey}
                                                activeSortDir={sortDir}
                                                onSort={toggleSort}
                                                icon={sortIcon("start_date")}
                                            />
                                        </th>

                                        <th scope="col" className="text-nowrap" aria-sort={getAriaSortValue(sortKey, sortDir, "end_date")}>
                                            <SortHeader
                                                label="End date"
                                                sortKey="end_date"
                                                activeSortKey={sortKey}
                                                activeSortDir={sortDir}
                                                onSort={toggleSort}
                                                icon={sortIcon("end_date")}
                                            />
                                        </th>

                                        <th scope="col" className="text-nowrap" style={{ width: 170 }}>
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

                                                {/* Keep row actions compact while still exposing edit and delete directly. */}
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
                    </div>

                    {/* Mobile card layout. */}
                    <div className="d-md-none">
                        {refreshing && (
                            <div className="d-flex align-items-center gap-2 small text-body-secondary p-2 border rounded mb-3">
                                <Spinner animation="border" size="sm" />
                                <span>Refreshing projects...</span>
                            </div>
                        )}

                        {pageRows.length === 0 ? (
                            <div className="border rounded p-4 text-center text-body-secondary">
                                {hasActiveFilters
                                    ? "No projects match your current search or filters."
                                    : "No projects yet. Create your first project."}
                            </div>
                        ) : (
                            pageRows.map((row) => <ProjectMobileCard key={row.id} row={row} />)
                        )}
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
                                    <Pagination.Item key={item} active={item === safePage} onClick={() => setPage(item)}>
                                        {item}
                                    </Pagination.Item>
                                );
                            })}

                            <Pagination.Next
                                disabled={safePage >= totalPages}
                                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                            />

                            <Pagination.Last disabled={safePage >= totalPages} onClick={() => setPage(totalPages)} />
                        </Pagination>
                    </div>
                </>
            )}
        </Container>
    );
}

export default HomeView;