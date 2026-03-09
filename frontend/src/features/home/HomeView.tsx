import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Badge,
    Button,
    Card,
    Col,
    Form,
    Row,
    Spinner,
    Table,
} from "react-bootstrap";
import { Calendar, CalendarCheck, Lock, Pencil, RefreshCw, Trash2, TriangleAlert, User } from "lucide-react";
import type { HomeViewProps, HomeSortKey } from "./home.types";
import { HOME_PAGE_SIZE_OPTIONS } from "./home.constants";
import type { ProjectRecord } from "../projects/models/project.types";
import DeleteModal from "../projects/delete/DeleteModal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSortIcon(key: HomeSortKey, sortKey: HomeSortKey, sortDir: "asc" | "desc"): string {
    if (key !== sortKey) return " ⇅";
    return sortDir === "asc" ? " ▲" : " ▼";
}

function statusVariant(status: string): string {
    switch (status) {
        case "Active":     return "success";
        case "On Hold":    return "warning";
        case "Completed":  return "primary";
        case "Cancelled":  return "danger";
        default:           return "secondary";
    }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortHeader({
    label,
    colKey,
    sortKey,
    sortDir,
    toggleSort,
}: {
    label: string;
    colKey: HomeSortKey;
    sortKey: HomeSortKey;
    sortDir: "asc" | "desc";
    toggleSort: (key: HomeSortKey) => void;
}) {
    return (
        <th
            role="button"
            onClick={() => toggleSort(colKey)}
            style={{ cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}
        >
            {label}
            <span className="text-body-secondary" style={{ fontSize: "0.75em" }}>
                {getSortIcon(colKey, sortKey, sortDir)}
            </span>
        </th>
    );
}

// ---------------------------------------------------------------------------
// Delete target state
// ---------------------------------------------------------------------------

type DeleteTarget = { id: number; name: string } | null;

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function HomeView({
    rows,
    pagination,
    sort,
    filters,
    state,
    actions,
}: HomeViewProps) {
    const navigate = useNavigate();
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

    const { loading, refreshing, apiError } = state;

    const {
        page,
        totalPages,
        total,
        displayStart,
        displayEnd,
        pageSize,
        onPageChange,
        onPageSizeChange,
    } = pagination;

    const { key: sortKey, dir: sortDir, toggleSort } = sort;
    const { searchTerm, statusFilter, hasActiveFilters, onSearchChange, onStatusFilterChange } = filters;
    const { getData } = actions;

    // ── Loading skeleton ──
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
                <Spinner animation="border" variant="secondary" />
            </div>
        );
    }

    // ── Error state ──
    if (apiError) {
        return (
            <Card className="border shadow-sm">
                <Card.Header className="pt-section-header">Projects</Card.Header>
                <Card.Body className="text-center py-5">
                    <TriangleAlert size={32} className="text-danger mb-3" />
                    <div className="text-danger fw-semibold mb-2">Failed to load projects</div>
                    <div className="text-body-secondary small mb-4">{apiError}</div>
                    <Button variant="outline-secondary" size="sm" onClick={() => void getData()}>
                        Retry
                    </Button>
                </Card.Body>
            </Card>
        );
    }

    return (
        <>
            {/* ── Delete confirmation modal ── */}
            {deleteTarget && (
                <DeleteModal
                    projectId={deleteTarget.id}
                    projectName={deleteTarget.name}
                    show={Boolean(deleteTarget)}
                    onHide={() => setDeleteTarget(null)}
                    onDeleted={() => void getData({ isRefresh: true })}
                />
            )}

            <Card className="border shadow-sm">
                <Card.Header className="pt-section-header">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <span>Projects</span>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => void getData({ isRefresh: true })}
                            disabled={refreshing}
                            className="d-flex align-items-center gap-1"
                            aria-label="Refresh projects"
                        >
                            <RefreshCw size={14} className={refreshing ? "spin-icon" : ""} />
                            {refreshing ? "Refreshing…" : "Refresh"}
                        </Button>
                    </div>
                </Card.Header>

                <Card.Body className="pb-0">
                    {/* ── Filters ── */}
                    <Row className="g-2 mb-3">
                        <Col xs={12} sm={6} md={5} lg={4}>
                            <Form.Control
                                type="search"
                                size="sm"
                                placeholder="Search by name…"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </Col>
                        <Col xs={12} sm={6} md={4} lg={3}>
                            <Form.Select
                                size="sm"
                                value={statusFilter}
                                onChange={(e) => onStatusFilterChange(e.target.value as typeof statusFilter)}
                            >
                                <option value="All">All statuses</option>
                                <option value="Active">Active</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </Form.Select>
                        </Col>
                        {hasActiveFilters && (
                            <Col xs="auto">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => {
                                        onSearchChange("");
                                        onStatusFilterChange("All");
                                    }}
                                >
                                    Clear filters
                                </Button>
                            </Col>
                        )}
                    </Row>

                    {/* ── Desktop table ── */}
                    <div className="d-none d-md-block">
                        <Table hover responsive className="mb-0" style={{ fontSize: "0.875rem" }}>
                            <thead>
                                <tr>
                                    <SortHeader label="Name"     colKey="name"           sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} />
                                    <SortHeader label="Status"   colKey="status"         sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} />
                                    <SortHeader label="Comments" colKey="comments"       sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} />
                                    <SortHeader label="Security" colKey="security_level" sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} />
                                    <SortHeader label="Start"    colKey="start_date"     sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} />
                                    <SortHeader label="End"      colKey="end_date"       sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort} />
                                    <th>Manager</th>
                                    <th style={{ width: 90 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center text-body-secondary py-4">
                                            {hasActiveFilters ? "No projects match your filters." : "No projects yet."}
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((project: ProjectRecord) => (
                                        <tr key={project.id}>
                                            <td className="fw-medium">{project.name}</td>
                                            <td>
                                                <Badge bg={statusVariant(project.status ?? "")} className="fw-normal">
                                                    {project.status}
                                                </Badge>
                                            </td>
                                            <td className="text-truncate" style={{ maxWidth: 180 }}>{project.comments}</td>
                                            <td>{project.security_level}</td>
                                            <td>{project.start_date ?? "—"}</td>
                                            <td>{project.end_date ?? "—"}</td>
                                            <td>
                                                {project.manager
                                                    ? project.manager.name
                                                    : <span className="text-body-secondary">—</span>}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        className="p-1"
                                                        aria-label={`Edit ${project.name}`}
                                                        onClick={() => navigate(`/edit/${project.id}`)}
                                                    >
                                                        <Pencil size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="p-1"
                                                        aria-label={`Delete ${project.name}`}
                                                        onClick={() => setDeleteTarget({ id: project.id, name: project.name })}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* ── Mobile cards ── */}
                    <div className="d-md-none">
                        {rows.length === 0 ? (
                            <div className="text-center text-body-secondary py-4">
                                {hasActiveFilters ? "No projects match your filters." : "No projects yet."}
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {rows.map((project: ProjectRecord) => (
                                    <Card key={project.id} className="border">
                                        <Card.Body className="p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>{project.name}</div>
                                                <Badge bg={statusVariant(project.status ?? "")} className="fw-normal ms-2 flex-shrink-0">
                                                    {project.status}
                                                </Badge>
                                            </div>
                                            {project.comments && (
                                                <div className="text-body-secondary small mb-2">{project.comments}</div>
                                            )}
                                            <div className="d-flex flex-wrap gap-2 small text-body-secondary mb-2">
                                                {project.manager && (
                                                    <span className="d-flex align-items-center gap-1">
                                                        <User size={12} />
                                                        {project.manager.name}
                                                    </span>
                                                )}
                                                {project.start_date && (
                                                    <span className="d-flex align-items-center gap-1">
                                                        <Calendar size={12} />
                                                        {project.start_date}
                                                    </span>
                                                )}
                                                {project.end_date && (
                                                    <span className="d-flex align-items-center gap-1">
                                                        <CalendarCheck size={12} />
                                                        {project.end_date}
                                                    </span>
                                                )}
                                                <span className="d-flex align-items-center gap-1">
                                                    <Lock size={12} />
                                                    {project.security_level}
                                                </span>
                                            </div>
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    aria-label={`Edit ${project.name}`}
                                                    onClick={() => navigate(`/edit/${project.id}`)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    aria-label={`Delete ${project.name}`}
                                                    onClick={() => setDeleteTarget({ id: project.id, name: project.name })}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </Card.Body>

                {/* ── Pagination ── */}
                {total > 0 && (
                    <Card.Footer className="d-flex align-items-center justify-content-between flex-wrap gap-2 py-2">
                        <div className="text-body-secondary" style={{ fontSize: "0.8rem" }}>
                            Showing {displayStart}–{displayEnd} of {total}
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <Form.Select
                                size="sm"
                                style={{ width: "auto" }}
                                value={pageSize}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            >
                                {HOME_PAGE_SIZE_OPTIONS.map((n) => (
                                    <option key={n} value={n}>{n} / page</option>
                                ))}
                            </Form.Select>

                            <div className="d-flex gap-1">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={page <= 1}
                                    aria-label="Previous page"
                                    onClick={() => onPageChange(page - 1)}
                                >
                                    ‹
                                </Button>
                                <span
                                    className="d-flex align-items-center px-2"
                                    style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
                                >
                                    {page} / {totalPages}
                                </span>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    aria-label="Next page"
                                    onClick={() => onPageChange(page + 1)}
                                >
                                    ›
                                </Button>
                            </div>
                        </div>
                    </Card.Footer>
                )}
            </Card>
        </>
    );
}
