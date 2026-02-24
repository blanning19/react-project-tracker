import { useEffect, useMemo, useState } from 'react';
import FetchInstance from './fetchClient';
import Dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { Container, Button, Spinner, Alert, Table } from 'react-bootstrap';
import { API } from '../api/routes';

const Home = () => {
    const [myData, setMyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortKey, setSortKey] = useState('name');
    const [sortDir, setSortDir] = useState('asc'); // "asc" | "desc"

    const GetData = async () => {
        setApiError('');
        setLoading(true);

        try {
            const res = await FetchInstance.get(API.projects.list);
            const data = res.data;
            const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
            setMyData(list);
        } catch (err) {
            console.error('GET /project/ failed:', err?.data ?? err);
            setApiError('Failed to load projects.');
            setMyData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        GetData();
    }, []);

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else {
            setSortKey(key);
            setSortDir('asc');
        }

        setPage(1);
    };

    const sortedData = useMemo(() => {
        const getVal = (row) => {
            const v = row?.[sortKey];
            if (v == null) return '';
            return typeof v === 'string' ? v.toLowerCase() : v;
        };

        const copy = [...myData];
        copy.sort((a, b) => {
            const av = getVal(a),
                bv = getVal(b);
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return copy;
    }, [myData, sortKey, sortDir]);

    const total = sortedData.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = sortedData.slice(start, end);

    const sortIcon = (key) => (sortKey !== key ? '' : sortDir === 'asc' ? ' ▲' : ' ▼');

    return (
        <Container className="py-4">
            <div className="px-3 py-2 mb-3 bg-body-tertiary border rounded">
                <div className="d-flex align-items-center justify-content-between">
                    <strong>Projects</strong>
                    <Button as={Link} to="create" variant="primary" size="sm">
                        + Create
                    </Button>
                </div>
            </div>

            {apiError && (
                <Alert variant="danger" className="fw-bold">
                    {apiError}{' '}
                    <Button variant="outline-light" size="sm" className="ms-2" onClick={GetData}>
                        Retry
                    </Button>
                </Alert>
            )}

            {loading ? (
                <div className="d-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" />
                    <span>Loading data...</span>
                </div>
            ) : (
                <>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="text-body-secondary small">
                            Showing {total === 0 ? 0 : start + 1}-{Math.min(end, total)} of {total}
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
                                {[5, 10, 20, 50].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive border rounded">
                        <Table striped hover responsive className="mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th role="button" onClick={() => toggleSort('name')} className="text-nowrap">
                                        Name{sortIcon('name')}
                                    </th>
                                    <th role="button" onClick={() => toggleSort('status')} className="text-nowrap">
                                        Status{sortIcon('status')}
                                    </th>
                                    <th role="button" onClick={() => toggleSort('comments')} className="text-nowrap">
                                        Comments{sortIcon('comments')}
                                    </th>
                                    <th role="button" onClick={() => toggleSort('start_date')} className="text-nowrap">
                                        Start date{sortIcon('start_date')}
                                    </th>
                                    <th role="button" onClick={() => toggleSort('end_date')} className="text-nowrap">
                                        End date{sortIcon('end_date')}
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
                                            No projects found.
                                        </td>
                                    </tr>
                                ) : (
                                    pageRows.map((row) => (
                                        <tr key={row.id}>
                                            <td className="fw-semibold">{row.name ?? ''}</td>
                                            <td>{row.status ?? ''}</td>
                                            <td style={{ maxWidth: 520, whiteSpace: 'normal' }}>
                                                {row.comments ?? ''}
                                            </td>
                                            <td className="text-nowrap">
                                                {row.start_date ? Dayjs(row.start_date).format('MM-DD-YYYY') : ''}
                                            </td>
                                            <td className="text-nowrap">
                                                {row.end_date ? Dayjs(row.end_date).format('MM-DD-YYYY') : ''}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        as={Link}
                                                        to={`edit/${row.id}`}
                                                        variant="outline-secondary"
                                                        size="sm"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        as={Link}
                                                        to={`delete/${row.id}`}
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
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                ‹ Prev
                            </button>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                disabled={safePage >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
};

export default Home;
