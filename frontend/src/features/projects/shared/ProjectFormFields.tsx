import { useMemo, useState } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import type { PersonOption, ProjectFormValues } from "../models/project.types";
import { SECURITY_LEVEL_OPTIONS } from "./projectFormConfig";

interface ProjectFormFieldsProps {
    control: Control<ProjectFormValues>;
    errors: FieldErrors<ProjectFormValues>;
    projectManagers?: PersonOption[];
    employees?: PersonOption[];
    statusOptions?: Array<{ id: string; name: string }>;
}

/**
 * Builds the display name used in project manager and employee option lists.
 *
 * Preference order:
 * - explicit "name" property when available
 * - first + last name combination
 * - fallback id label
 */
function getPersonName(person: PersonOption): string {
    return (person.name ?? `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim()) || `#${person.id}`;
}

/**
 * Toggles a string value in a list of selected ids.
 *
 * If the id already exists, it is removed. Otherwise, it is appended.
 */
function toggleSelectedValue(values: string[], id: string): string[] {
    return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

function ProjectFormFields({
    control,
    errors,
    projectManagers = [],
    employees = [],
    statusOptions = [],
}: ProjectFormFieldsProps): JSX.Element {
    const [employeeSearch, setEmployeeSearch] = useState("");

    const employeeOptions = useMemo(
        () =>
            (employees ?? [])
                .map((employee) => ({ id: String(employee.id), name: getPersonName(employee) }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [employees]
    );

    const filteredEmployeeOptions = useMemo(() => {
        const normalizedSearch = employeeSearch.trim().toLowerCase();

        if (!normalizedSearch) {
            return employeeOptions;
        }

        return employeeOptions.filter((employee) => employee.name.toLowerCase().includes(normalizedSearch));
    }, [employeeOptions, employeeSearch]);

    return (
        <div className="d-flex flex-column gap-3">
            <Card className="shadow-sm">
                <Card.Header className="pt-section-header">
                    <div className="d-flex align-items-start gap-2">
                        <div className="border-start border-3 border-secondary ps-3 w-100">
                            <div className="fw-semibold text-body">Project basics</div>
                            <div className="small text-body-secondary">Name, status, and classification.</div>
                        </div>
                    </div>
                </Card.Header>

                <Card.Body className="d-flex flex-column gap-3">
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Label>Name</Form.Label>

                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Form.Control
                                        {...field}
                                        placeholder="Provide a project name"
                                        isInvalid={Boolean(errors.name)}
                                    />
                                )}
                            />

                            <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                        </Col>
                    </Row>

                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Label>Status</Form.Label>

                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Form.Select {...field} isInvalid={Boolean(errors.status)}>
                                        <option value="">Select status...</option>

                                        {statusOptions.map((option) => (
                                            <option key={option.id || option.name} value={option.id || option.name}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            />

                            <Form.Control.Feedback type="invalid">{errors.status?.message}</Form.Control.Feedback>
                        </Col>

                        <Col md={4}>
                            <Form.Label>Security level</Form.Label>

                            <Controller
                                name="security_level"
                                control={control}
                                render={({ field }) => (
                                    <Form.Select {...field} isInvalid={Boolean(errors.security_level)}>
                                        {SECURITY_LEVEL_OPTIONS.map((opt) => (
                                            <option key={opt.id} value={opt.id}>
                                                {opt.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            />

                            <Form.Control.Feedback type="invalid">{errors.security_level?.message}</Form.Control.Feedback>

                            <Form.Text className="text-body-secondary">
                                Use “Internal” unless the project contains sensitive customer or security data.
                            </Form.Text>
                        </Col>

                        <Col md={4}>
                            <Form.Label>Project manager</Form.Label>

                            <Controller
                                name="projectmanager"
                                control={control}
                                render={({ field }) => (
                                    <Form.Select {...field} isInvalid={Boolean(errors.projectmanager)}>
                                        <option value="">Select project manager...</option>

                                        {projectManagers.map((projectManager) => (
                                            <option key={projectManager.id} value={String(projectManager.id)}>
                                                {getPersonName(projectManager)}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            />

                            <Form.Control.Feedback type="invalid">{errors.projectmanager?.message}</Form.Control.Feedback>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm">
                <Card.Header className="pt-section-header">
                    <div className="d-flex align-items-start gap-2">
                        <div className="border-start border-3 border-secondary ps-3 w-100">
                            <div className="fw-semibold text-body">People</div>
                            <div className="small text-body-secondary">Project manager and assigned employees.</div>
                        </div>
                    </div>
                </Card.Header>

                <Card.Body className="d-flex flex-column gap-3">
                    <Controller
                        name="employees"
                        control={control}
                        render={({ field }) => {
                            const selectedValues = (field.value ?? []).map(String);
                            const selectedCount = selectedValues.length;

                            return (
                                <>
                    <div>
                        <Form.Label className="mb-1">Employees</Form.Label>

                        <div className="input-group">
                            <Form.Control
                                type="text"
                                placeholder="Search employees..."
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                aria-label="Search employees"
                            />

                            <Button
                                type="button"
                                variant="outline-secondary"
                                disabled={!employeeSearch.trim()}
                                onClick={() => setEmployeeSearch("")}
                            >
                                Clear
                            </Button>
                        </div>

                        <div className="small text-body-secondary mt-2">
                            Choose one or more employees to assign to this project.
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-lg-row align-items-stretch gap-3">
                        {/* Selection box */}
                        <div
                            className={`border rounded p-2 flex-grow-1 ${errors.employees ? "border-danger" : ""}`}
                            style={{ maxHeight: 260, overflowY: "auto", minWidth: 0 }}
                        >
                            {employeeOptions.length === 0 ? (
                                <div className="text-body-secondary small p-2">No employees available.</div>
                            ) : filteredEmployeeOptions.length === 0 ? (
                                <div className="text-body-secondary small p-2">No employees match your search.</div>
                            ) : (
                                filteredEmployeeOptions.map((employee) => (
                                    <Form.Check
                                        key={employee.id}
                                        id={`employee-${employee.id}`}
                                        type="checkbox"
                                        className="mb-2"
                                        label={employee.name}
                                        checked={selectedValues.includes(employee.id)}
                                        onChange={() => field.onChange(toggleSelectedValue(selectedValues, employee.id))}
                                    />
                                ))
                            )}
                        </div>

                        {/* Right-side centered action lane */}
                        <div className="d-flex justify-content-center align-items-center" style={{ minWidth: "160px" }}>
                            <Button
                                type="button"
                                variant="outline-secondary"
                                size="sm"
                                disabled={selectedCount === 0}
                                onClick={() => field.onChange([])}
                            >
                                Clear selected
                            </Button>
                        </div>
                    </div>

                                    <Form.Control.Feedback type="invalid" className={errors.employees ? "d-block" : ""}>
                                        {errors.employees?.message}
                                    </Form.Control.Feedback>

                                    <div className="text-body-secondary small">
                                        Select one or more employees to assign to this project.
                                    </div>
                                </>
                            );
                        }}
                    />
                </Card.Body>
            </Card>

            <Card className="shadow-sm">
                <Card.Header className="pt-section-header">
                    <div className="d-flex align-items-start gap-2">
                        <div className="border-start border-3 border-secondary ps-3 w-100">
                            <div className="fw-semibold text-body">Schedule</div>
                            <div className="small text-body-secondary">Start and end dates.</div>
                        </div>
                    </div>
                </Card.Header>

                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label>Start date</Form.Label>

                            <Controller
                                name="start_date"
                                control={control}
                                render={({ field }) => (
                                    <Form.Control
                                        type="date"
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        isInvalid={Boolean(errors.start_date)}
                                    />
                                )}
                            />

                            <Form.Control.Feedback type="invalid">{errors.start_date?.message}</Form.Control.Feedback>
                        </Col>

                        <Col md={6}>
                            <Form.Label>End date</Form.Label>

                            <Controller
                                name="end_date"
                                control={control}
                                render={({ field }) => (
                                    <Form.Control
                                        type="date"
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        isInvalid={Boolean(errors.end_date)}
                                    />
                                )}
                            />

                            <Form.Control.Feedback type="invalid">{errors.end_date?.message}</Form.Control.Feedback>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm">
                <Card.Header className="pt-section-header">
                    <div className="d-flex align-items-start gap-2">
                        <div className="border-start border-3 border-secondary ps-3 w-100">
                            <div className="fw-semibold text-body">Comments</div>
                            <div className="small text-body-secondary">Optional notes for context.</div>
                        </div>
                    </div>
                </Card.Header>

                <Card.Body>
                    <Controller
                        name="comments"
                        control={control}
                        render={({ field }) => (
                            <Form.Control {...field} as="textarea" rows={5} placeholder="Provide project comments" />
                        )}
                    />
                </Card.Body>
            </Card>
        </div>
    );
}

export default ProjectFormFields;