// ProjectFormFields.jsx
import { useMemo } from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { Controller } from 'react-hook-form';

const ProjectFormFields = ({ control, errors, projectmanager = [], employees = [], statusOptions = [] }) => {
    const employeeOptions = useMemo(
        () =>
            (employees ?? []).map((e) => ({
                id: e.id,
                name: `${e.first_name} ${e.last_name}`,
            })),
        [employees]
    );

    return (
        <>
            {/* Row 1 */}
            <Row className="g-4 mb-3">
                <Col md={4}>
                    <Form.Label>Name</Form.Label>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Form.Control {...field} placeholder="Provide a project name" isInvalid={!!errors.name} />
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                </Col>

                <Col md={4}>
                    <Form.Label>Start date</Form.Label>
                    <Controller
                        name="start_date"
                        control={control}
                        render={({ field }) => <Form.Control {...field} type="date" isInvalid={!!errors.start_date} />}
                    />
                    <Form.Control.Feedback type="invalid">{errors.start_date?.message}</Form.Control.Feedback>
                </Col>

                <Col md={4}>
                    <Form.Label>End date</Form.Label>
                    <Controller
                        name="end_date"
                        control={control}
                        render={({ field }) => <Form.Control {...field} type="date" isInvalid={!!errors.end_date} />}
                    />
                    <Form.Control.Feedback type="invalid">{errors.end_date?.message}</Form.Control.Feedback>
                </Col>
            </Row>

            {/* Row 2 */}
            <Row className="g-4 mb-3">
                <Col md={4}>
                    <Form.Label>Comments</Form.Label>
                    <Controller
                        name="comments"
                        control={control}
                        render={({ field }) => (
                            <Form.Control {...field} as="textarea" rows={4} placeholder="Provide project comments" />
                        )}
                    />
                </Col>

                <Col md={4}>
                    <Form.Label>Status</Form.Label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Form.Select {...field} isInvalid={!!errors.status}>
                                <option value="">Select status...</option>
                                {statusOptions.map((o) => (
                                    <option key={o.id || o.name} value={o.id}>
                                        {o.name}
                                    </option>
                                ))}
                            </Form.Select>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.status?.message}</Form.Control.Feedback>
                </Col>

                <Col md={4}>
                    <Form.Label>Project manager</Form.Label>
                    <Controller
                        name="projectmanager"
                        control={control}
                        render={({ field }) => (
                            <Form.Select {...field} isInvalid={!!errors.projectmanager}>
                                <option value="">Select project manager...</option>
                                {projectmanager.map((pm) => (
                                    <option key={pm.id} value={String(pm.id)}>
                                        {(pm.name ?? `${pm.first_name ?? ''} ${pm.last_name ?? ''}`.trim()) ||
                                            `PM #${pm.id}`}
                                    </option>
                                ))}
                            </Form.Select>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.projectmanager?.message}</Form.Control.Feedback>
                </Col>
            </Row>

            {/* Row 3 */}
            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Form.Label>Employees</Form.Label>
                    <Controller
                        name="employees"
                        control={control}
                        render={({ field }) => (
                            <Form.Select
                                multiple
                                value={field.value || []}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                                    field.onChange(selected);
                                }}
                                isInvalid={!!errors.employees}
                                style={{ minHeight: 160 }}
                            >
                                {employeeOptions.map((emp) => (
                                    <option key={emp.id} value={String(emp.id)}>
                                        {emp.name}
                                    </option>
                                ))}
                            </Form.Select>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.employees?.message}</Form.Control.Feedback>
                    <div className="text-muted small mt-2">Hold Ctrl (Windows) / Cmd (Mac) to select multiple.</div>
                </Col>
            </Row>
        </>
    );
};

export default ProjectFormFields;
