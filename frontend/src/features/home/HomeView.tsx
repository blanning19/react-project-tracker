import type { Dispatch, SetStateAction } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Container, Spinner, Table } from "react-bootstrap";
import type { ProjectRecord } from "../projects/models/project.types";

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
    sortIcon: (key: string) => string;
    getData: () => Promise<void>;
    setPage: Dispatch<SetStateAction<number>>;
    setPageSize: Dispatch<SetStateAction<number>>;
    toggleSort: (key: keyof ProjectRecord | "comments" | "status" | "start_date" | "end_date" | "name") => void;
}

const HomeView = ({ loading, apiError, total, totalPages, safePage, start, end, pageSize, pageRows, sortIcon, getData, setPage, setPageSize, toggleSort }: HomeViewProps) => (
    <Container className="py-4">
        <div className="px-3 py-2 mb-3 bg-body-tertiary border rounded">
            <div className="d-flex align-items-center justify-content-between">
                <strong>Projects</strong>
                <Button as={Link} to="/create" variant="primary" size="sm">+ Create</Button>
            </div>
        </div>

        {apiError && <Alert variant="danger" className="fw-bold">{apiError} <Button variant="outline-light" size="sm" className="ms-2" onClick={getData}>Retry</Button></Alert>}

        {loading ? (
            <div className="d-flex align-items-center gap-2"><Spinner animation="border" size="sm" /><span>Loading data...</span></div>
        ) : (
            <>
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="text-body-secondary small">Showing {total === 0 ? 0 : start + 1}-{Math.min(end, total)} of {total}</div>
                    <div className="d-flex align-items-center gap-2">
                        <div className="small text-body-secondary">Rows:</div>
                        <select className="form-select form-select-sm" style={{ width: 90 }} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                            {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                <div className="table-responsive border rounded">
                    <Table striped hover responsive className="mb-0 align-middle">
                        <thead className="table-light">
                            <tr>
                                <th role="button" onClick={() => toggleSort("name")} className="text-nowrap">Name{sortIcon("name")}</th>
                                <th role="button" onClick={() => toggleSort("status")} className="text-nowrap">Status{sortIcon("status")}</th>
                                <th role="button" onClick={() => toggleSort("comments")} className="text-nowrap">Comments{sortIcon("comments")}</th>
                                <th role="button" onClick={() => toggleSort("start_date")} className="text-nowrap">Start date{sortIcon("start_date")}</th>
                                <th role="button" onClick={() => toggleSort("end_date")} className="text-nowrap">End date{sortIcon("end_date")}</th>
                                <th className="text-nowrap" style={{ width: 190 }}>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {pageRows.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-body-secondary py-4">No projects found.</td></tr>
                            ) : (
                                pageRows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="fw-semibold">{row.name ?? ""}</td>
                                        <td>{row.status ?? ""}</td>
                                        <td style={{ maxWidth: 520, whiteSpace: "normal" }}>{row.comments ?? ""}</td>
                                        <td className="text-nowrap">{row.start_date ? Dayjs(row.start_date).format("MM-DD-YYYY") : ""}</td>
                                        <td className="text-nowrap">{row.end_date ? Dayjs(row.end_date).format("MM-DD-YYYY") : ""}</td>
                                        <td><div className="d-flex gap-2"><Button as={Link} to={`/edit/${row.id}`} variant="outline-secondary" size="sm">Edit</Button><Button as={Link} to={`/delete/${row.id}`} variant="outline-danger" size="sm">Delete</Button></div></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>

                <div className="d-flex align-items-center justify-content-between mt-3">
                    <div className="small text-body-secondary">Page {safePage} of {totalPages}</div>
                    <div className="btn-group" role="group" aria-label="Pagination">
                        <button className="btn btn-outline-secondary btn-sm" disabled={safePage <= 1} onClick={() => setPage(1)}>« First</button>
                        <button className="btn btn-outline-secondary btn-sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹ Prev</button>
                        <button className="btn btn-outline-secondary btn-sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next ›</button>
                        <button className="btn btn-outline-secondary btn-sm" disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>Last »</button>
                    </div>
                </div>
            </>
        )}
    </Container>
);

export default HomeView;
