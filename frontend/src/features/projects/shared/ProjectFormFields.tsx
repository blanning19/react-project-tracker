import { useMemo, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
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
 * This keeps the employees checkbox handler small and predictable.
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
    /**
     * Local search state for narrowing the employee checkbox list.
     * This improves usability when the employee list grows larger.
     */
    const [employeeSearch, setEmployeeSearch] = useState("");

    /**
     * Normalize employee records into a lightweight option shape, then sort
     * them alphabetically so the list is stable and easier to scan.
     */
    const employeeOptions = useMemo(
        () =>
            (employees ?? [])
                .map((employee) => ({ id: String(employee.id), name: getPersonName(employee) }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [employees]
    );

    /**
     * Apply a case-insensitive search filter to the sorted employee list.
     */
    const filteredEmployeeOptions = useMemo(() => {
        const normalizedSearch = employeeSearch.trim().toLowerCase();

        if (!normalizedSearch) {
            return employeeOptions;
        }

        return employeeOptions.filter((employee) => employee.name.toLowerCase().includes(normalizedSearch));
    }, [employeeOptions, employeeSearch]);

    return (
        <>
            {/* Project name is the primary identifier, so give it a full-width row. */}
            <Row className="g-4 mb-3">
                <Col md={12}>
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
            </Row>

            {/* Status and ownership belong together because they describe who owns the work and where it stands. */}
            <Row className="g-4 mb-3">
                <Col md={6}>
                    <Form.Label>Status</Form.Label>

                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Form.Select {...field} isInvalid={!!errors.status}>
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

                <Col md={6}>
                    <Form.Label>Project manager</Form.Label>

                    <Controller
                        name="projectmanager"
                        control={control}
                        render={({ field }) => (
                            <Form.Select {...field} isInvalid={!!errors.projectmanager}>
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
            <Row className="g-3">
                <Col md={6}>
                    <Form.Group controlId="security_level">
                        <Form.Label>Security level</Form.Label>

                        {/* Using Controller keeps this consistent with other controlled fields, but register() also works fine. */}
                        <Controller
                            name="security_level"
                            control={control}
                            render={({ field }) => (
                                <Form.Select
                                    {...field}
                                    aria-label="Security level"
                                    isInvalid={Boolean(errors.security_level)}
                                >
                                    {SECURITY_LEVEL_OPTIONS.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            )}
                        />

                        <Form.Control.Feedback type="invalid">
                            {errors.security_level?.message}
                        </Form.Control.Feedback>

                        <Form.Text className="text-body-secondary">
                            Use “Internal” unless the project contains sensitive customer or security data.
                        </Form.Text>
                    </Form.Group>
                </Col>
            </Row>

            {/* Start and end dates are paired scheduling fields, so keep them on the same row. */}
            <Row className="g-4 mb-3">
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
                                isInvalid={!!errors.start_date}
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
                                isInvalid={!!errors.end_date}
                            />
                        )}
                    />

                    <Form.Control.Feedback type="invalid">{errors.end_date?.message}</Form.Control.Feedback>
                </Col>
            </Row>

{/* Employees usually benefit from a more explicit selection UI than a native multi-select. */}
<Row className="g-4 mb-3">
    <Col md={12}>
        <Controller
            name="employees"
            control={control}
            render={({ field }) => {
                const selectedValues = (field.value ?? []).map(String);
                const selectedCount = selectedValues.length;

                return (
                    <>
                        {/* Search row keeps the search input dominant and centers the search-clear action beside it. */}
                        <div className="d-flex flex-column flex-lg-row align-items-start gap-3">
                            <div className="border rounded p-3 flex-grow-1" style={{ minWidth: 0 }}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search employees..."
                                    value={employeeSearch}
                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                />
                            </div>

                            {/* Fixed-width action area keeps the button visually centered and aligned across breakpoints. */}
                            <div className="d-flex justify-content-center align-items-center" style={{ minWidth: "140px" }}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={!employeeSearch}
                                    onClick={() => setEmployeeSearch("")}
                                >
                                    Clear search
                                </Button>
                            </div>
                        </div>

                        {/* Selected counter gives users immediate visibility into current assignment state. */}
                        <div className="d-flex justify-content-between align-items-center mt-3 mb-2">
                            <div className="small text-body-secondary">
                                Employees selected: <strong>{selectedCount}</strong>
                            </div>
                        </div>

                        {/* Selection row keeps the employee list visually dominant while centering the clear-selection action. */}
                        <div className="d-flex flex-column flex-lg-row align-items-start gap-3">
                            <div
                                className={`border rounded p-3 flex-grow-1 ${errors.employees ? "border-danger" : ""}`}
                                style={{ maxHeight: 260, overflowY: "auto", minWidth: 0 }}
                            >
                                {employeeOptions.length === 0 ? (
                                    <div className="text-body-secondary small">No employees available.</div>
                                ) : filteredEmployeeOptions.length === 0 ? (
                                    <div className="text-body-secondary small">No employees match your search.</div>
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

                            {/* Match the search-row action width so both right-side controls feel intentionally aligned. */}
                            <div className="d-flex justify-content-center align-items-center" style={{ minWidth: "140px" }}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={selectedCount === 0}
                                    onClick={() => field.onChange([])}
                                >
                                    Clear selected
                                </Button>
                            </div>
                        </div>
                    </>
                );
            }}
        />

        <Form.Control.Feedback type="invalid" className={errors.employees ? "d-block" : ""}>
            {errors.employees?.message}
        </Form.Control.Feedback>

        <div className="text-body-secondary small mt-2">
            Select one or more employees to assign to this project.
        </div>
    </Col>
</Row>

            {/* Comments should have room to breathe since it is the most free-form field on the page. */}
            <Row className="g-4 mb-4">
                <Col md={12}>
                    <Form.Label>Comments</Form.Label>

                    <Controller
                        name="comments"
                        control={control}
                        render={({ field }) => (
                            <Form.Control {...field} as="textarea" rows={5} placeholder="Provide project comments" />
                        )}
                    />
                </Col>
            </Row>
        </>
    );
}

export default ProjectFormFields;