import { useMemo } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import type { PersonOption, ProjectFormValues } from "../models/project.types";

interface ProjectFormFieldsProps {
    control: Control<ProjectFormValues>;
    errors: FieldErrors<ProjectFormValues>;
    projectmanager?: PersonOption[];
    employees?: PersonOption[];
    statusOptions?: Array<{ id: string; name: string }>;
}

const getPersonName = (person: PersonOption) => (person.name ?? `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim()) || `#${person.id}`;

const ProjectFormFields = ({ control, errors, projectmanager = [], employees = [], statusOptions = [] }: ProjectFormFieldsProps) => {
    const employeeOptions = useMemo(() => (employees ?? []).map((employee) => ({ id: employee.id, name: getPersonName(employee) })), [employees]);

    return (
        <>
            <Row className="g-4 mb-3">
                <Col md={4}>
                    <Form.Label>Name</Form.Label>
                    <Controller name="name" control={control} render={({ field }) => <Form.Control {...field} placeholder="Provide a project name" isInvalid={!!errors.name} />} />
                    <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                </Col>

                <Col md={4}>
                    <Form.Label>Start date</Form.Label>
                    <Controller name="start_date" control={control} render={({ field }) => <Form.Control type="date" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} isInvalid={!!errors.start_date} />} />
                    <Form.Control.Feedback type="invalid">{errors.start_date?.message}</Form.Control.Feedback>
                </Col>

                <Col md={4}>
                    <Form.Label>End date</Form.Label>
                    <Controller name="end_date" control={control} render={({ field }) => <Form.Control type="date" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} isInvalid={!!errors.end_date} />} />
                    <Form.Control.Feedback type="invalid">{errors.end_date?.message}</Form.Control.Feedback>
                </Col>
            </Row>

            <Row className="g-4 mb-3">
                <Col md={4}>
                    <Form.Label>Comments</Form.Label>
                    <Controller name="comments" control={control} render={({ field }) => <Form.Control {...field} as="textarea" rows={4} placeholder="Provide project comments" />} />
                </Col>

                <Col md={4}>
                    <Form.Label>Status</Form.Label>
                    <Controller name="status" control={control} render={({ field }) => <Form.Select {...field} isInvalid={!!errors.status}><option value="">Select status...</option>{statusOptions.map((option) => <option key={option.id || option.name} value={option.id || option.name}>{option.name}</option>)}</Form.Select>} />
                    <Form.Control.Feedback type="invalid">{errors.status?.message}</Form.Control.Feedback>
                </Col>

                <Col md={4}>
                    <Form.Label>Project manager</Form.Label>
                    <Controller name="projectmanager" control={control} render={({ field }) => <Form.Select {...field} isInvalid={!!errors.projectmanager}><option value="">Select project manager...</option>{(Array.isArray(projectmanager) ? projectmanager : []).map((pm) => <option key={pm.id} value={String(pm.id)}>{getPersonName(pm)}</option>)}</Form.Select>} />
                    <Form.Control.Feedback type="invalid">{errors.projectmanager?.message}</Form.Control.Feedback>
                </Col>
            </Row>

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Form.Label>Employees</Form.Label>
                    <Controller name="employees" control={control} render={({ field }) => <Form.Select multiple value={field.value || []} onChange={(e) => field.onChange(Array.from(e.target.selectedOptions).map((option) => option.value))} isInvalid={!!errors.employees} style={{ minHeight: 160 }}>{employeeOptions.map((employee) => <option key={employee.id} value={String(employee.id)}>{employee.name}</option>)}</Form.Select>} />
                    <Form.Control.Feedback type="invalid">{errors.employees?.message}</Form.Control.Feedback>
                    <div className="text-muted small mt-2">Hold Ctrl (Windows) / Cmd (Mac) to select multiple.</div>
                </Col>
            </Row>
        </>
    );
};

export default ProjectFormFields;
