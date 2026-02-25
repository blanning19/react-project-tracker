import { useEffect, useState } from "react";
import { Container, Form, Button, Alert, Card } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";

import FetchInstance from "./fetchClient";
import ProjectFormFields from "./forms/ProjectFormFields";
import { DEFAULT_VALUES, PROJECT_SCHEMA, STATUS_OPTIONS } from "./projectFormConfig";
import { API } from "../api/routes";

const normalizeListResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
};

const Create = () => {
    const [projectManagers, setProjectManagers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    const navigate = useNavigate();

    const { handleSubmit, control, formState: { errors } } = useForm({
        defaultValues: DEFAULT_VALUES,
        resolver: yupResolver(PROJECT_SCHEMA),
    });

    useEffect(() => {
        const getData = async () => {
            setApiError("");

            try {
                const [pmRes, empRes] = await Promise.all([
                    FetchInstance.get(API.projectManagers),
                    FetchInstance.get(API.employees),
                ]);

                console.log("projectmanagers raw response:", pmRes.data);
                console.log("employees raw response:", empRes.data);

                setProjectManagers(normalizeListResponse(pmRes.data));
                setEmployees(normalizeListResponse(empRes.data));
            } catch (err) {
                console.error("GET lookup data failed:", err?.response?.status, err?.response?.data ?? err);
                setApiError("Failed to load dropdown data.");
            } finally {
                setLoading(false);
            }
        };

        getData();
    }, []);

    const submission = async (data) => {
        setApiError("");
        const toYMD = (v) => { if (!v) return null; if (v instanceof Date) return v.toISOString().slice(0, 10); const s = String(v).trim(); if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10); const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); };

        // In submission()
        const payload = {
            name: data.name,
            projectmanager: data.projectmanager ? Number(data.projectmanager) : null,
            employees: (data.employees ?? []).map(Number),
            status: data.status,
            comments: data.comments,
            start_date: toYMD(data.start_date),
            end_date: toYMD(data.end_date),
        };

        console.log("raw dates:", data.start_date, data.end_date);
        console.log("payload dates:", payload.start_date, payload.end_date);

        try {
            console.log("POST payload:", payload);
            const res = await FetchInstance.post(API.projects.list, payload);
            console.log("POST projects OK", res.status, res.data);
            navigate(`/`);
        } catch (err) {
            const status = err?.response?.status ?? err?.status;
            const body = err?.response?.data ?? err?.data;

            console.error("POST projects failed:", status, body ?? err);

            if (body && typeof body === "object") {
                const message = Object.values(body).flat().join(" ");
                setApiError(message || "Validation error.");
            } else {
                setApiError("Request failed. Check console for details.");
            }
        }
    };

    if (loading) return <p>Loading data...</p>;

    return (
        <Container className="py-4">
            <div className="page-header px-3 py-2 mb-3 border rounded"><strong>Create records</strong></div>

            <Card className="shadow-sm">
                <Card.Body>
                    {apiError && <Alert variant="danger" className="fw-bold">{apiError}</Alert>}

                    <Form onSubmit={handleSubmit(submission)}>
                        <ProjectFormFields control={control} errors={errors} projectmanager={projectManagers} employees={employees} statusOptions={STATUS_OPTIONS} />

                        <div className="d-flex justify-content-end">
                            <Button type="submit" variant="primary" style={{ width: "30%" }}>Submit</Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Create;