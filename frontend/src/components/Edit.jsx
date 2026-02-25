import { useEffect, useState } from "react";
import { Container, Form, Button, Alert, Card } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";

import FetchInstance from "./fetchClient";
import ProjectFormFields from "./forms/ProjectFormFields";
import { DEFAULT_VALUES, PROJECT_SCHEMA, STATUS_OPTIONS, projectToFormValues, formToPayload } from "./projectFormConfig";
import { API } from "../api/routes";

const normalizeListResponse = (data) => { if (Array.isArray(data)) return data; if (Array.isArray(data?.results)) return data.results; return []; };

const Edit = () => {
    const { id: MyId } = useParams();

    const [projectManagers, setProjectManagers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState("");

    const navigate = useNavigate();

    const { handleSubmit, setValue, control, formState: { errors } } = useForm({ defaultValues: DEFAULT_VALUES, resolver: yupResolver(PROJECT_SCHEMA) });

    useEffect(() => {
        const getData = async () => {
            setApiError("");
            setLoading(true);

            try {
                const [pmRes, empRes, projRes] = await Promise.all([FetchInstance.get(API.projectManagers), FetchInstance.get(API.employees), FetchInstance.get(API.projects.detail(MyId))]);

                setProjectManagers(normalizeListResponse(pmRes.data));
                setEmployees(normalizeListResponse(empRes.data));

                const formVals = projectToFormValues(projRes.data);
                Object.entries(formVals).forEach(([key, val]) => setValue(key, val, { shouldValidate: false, shouldDirty: false }));
            } catch (err) {
                console.error("Edit GetData failed:", err?.response?.status, err?.response?.data ?? err?.data ?? err);
                setApiError("Failed to load project data.");
            } finally {
                setLoading(false);
            }
        };

        if (MyId) getData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [MyId]);

    const submission = async (data) => {
        setApiError("");

        const payload = formToPayload(data);

        try {
            const res = await FetchInstance.put(API.projects.detail(MyId), payload);
            console.log("PUT project OK", res?.status, res?.data);
            navigate(`/`);
        } catch (err) {
            const status = err?.response?.status ?? err?.status;
            const body = err?.response?.data ?? err?.data;

            console.error("PUT project failed:", status, body ?? err);

            if (body && typeof body === "object") {
                const message = Object.values(body).flat().join(" ");
                setApiError(message || "Validation error.");
            } else if (status) {
                setApiError(`Request failed (${status}).`);
            } else {
                setApiError("An unexpected error occurred.");
            }
        }
    };

    if (loading) return <p>Loading data...</p>;

    return (
        <Container className="py-4">
            <div className="page-header px-3 py-2 mb-3 border rounded"><strong>Edit records</strong></div>

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

export default Edit;