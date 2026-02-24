import { useEffect, useState } from 'react';
import FetchInstance from './fetchClient';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import ProjectFormFields from './forms/ProjectFormFields';
import {
    DEFAULT_VALUES,
    PROJECT_SCHEMA,
    STATUS_OPTIONS,
    projectToFormValues,
    formToPayload,
} from './projectFormConfig';
import { API } from '../api/routes';

const Edit = () => {
    const { id: MyId } = useParams();

    const [projectmanager, setProjectmanager] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');

    const navigate = useNavigate();

    const {
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: DEFAULT_VALUES,
        resolver: yupResolver(PROJECT_SCHEMA),
    });

    const GetData = async () => {
        setApiError('');
        setLoading(true);

        try {
            const [pmRes, empRes, projRes] = await Promise.all([
                FetchInstance.get(API.projectManagers),
                FetchInstance.get(API.employees),
                FetchInstance.get(API.projects.detail(MyId)),
            ]);

            setProjectmanager(pmRes.data);

            const empData = empRes.data;
            const empList = Array.isArray(empData) ? empData : Array.isArray(empData?.results) ? empData.results : [];
            setEmployees(empList);

            const formVals = projectToFormValues(projRes.data);
            Object.entries(formVals).forEach(([key, val]) =>
                setValue(key, val, { shouldValidate: false, shouldDirty: false })
            );
        } catch (err) {
            console.error('Edit GetData failed:', err?.data ?? err);
            setApiError('Failed to load project data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        GetData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [MyId]);

    const submission = async (data) => {
        setApiError('');

        const payload = formToPayload(data);

        try {
            await FetchInstance.put(API.projects.detail(MyId), payload);
            navigate(`/`);
        } catch (err) {
            console.error('PUT /project failed:', err?.data ?? err);

            const errorsObj = err?.data;
            if (errorsObj && typeof errorsObj === 'object') {
                const message = Object.values(errorsObj).flat().join(' ');
                setApiError(message);
            } else if (err?.code === 'ECONNABORTED') {
                setApiError('Request timed out. Please try again.');
            } else {
                setApiError('An unexpected error occurred.');
            }
        }
    };

    if (loading) return <p>Loading data...</p>;

    return (
        <Container className="py-4">
            <div className="page-header px-3 py-2 mb-3 border rounded">
                <strong>Edit records</strong>
            </div>

            <Card className="shadow-sm">
                <Card.Body>
                    {apiError && (
                        <Alert variant="danger" className="fw-bold">
                            {apiError}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit(submission)}>
                        <ProjectFormFields
                            control={control}
                            errors={errors}
                            projectmanager={projectmanager}
                            employees={employees}
                            statusOptions={STATUS_OPTIONS}
                        />

                        <div className="d-flex justify-content-end">
                            <Button type="submit" variant="primary" style={{ width: '30%' }}>
                                Submit
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Edit;
