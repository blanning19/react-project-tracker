import { useEffect, useState } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import FetchInstance from './fetchClient';
import Dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import ProjectFormFields from './forms/ProjectFormFields';
import { DEFAULT_VALUES, PROJECT_SCHEMA, STATUS_OPTIONS } from './projectFormConfig';
import { yupResolver } from '@hookform/resolvers/yup';
import { API } from '../api/routes';

const Create = () => {
    const [projectmanager, setProjectmanager] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');

    const navigate = useNavigate();

    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: DEFAULT_VALUES,
        resolver: yupResolver(PROJECT_SCHEMA),
    });

    const GetData = async () => {
        try {
            const pmRes = await FetchInstance.get(API.projectManagers);
            setProjectmanager(pmRes.data);

            const empRes = await FetchInstance.get(API.employees);
            const data = empRes.data;

            let list = [];
            if (Array.isArray(data)) list = data;
            else if (Array.isArray(data?.results)) list = data.results;

            setEmployees(list);
        } catch (err) {
            console.error('GET lookup data failed:', err);
            setApiError('Failed to load dropdown data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        GetData();
    }, []);

    const submission = async (data) => {
        setApiError('');

        const StartDate = Dayjs(data.start_date).format('YYYY-MM-DD');
        const EndDate = Dayjs(data.end_date).format('YYYY-MM-DD');

        const payload = {
            name: data.name,
            projectmanager: Number(data.projectmanager),
            employees: (data.employees ?? []).map(Number),
            status: data.status,
            comments: data.comments,
            start_date: StartDate,
            end_date: EndDate,
        };

        try {
            const res = await FetchInstance.post(API.projects.list, payload);
            console.log('POST /project/ OK', res.status, res.data);
            navigate(`/`);
        } catch (err) {
            console.error('POST /project/ failed:', err?.data ?? err);

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
                <strong>Create records</strong>
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

export default Create;
