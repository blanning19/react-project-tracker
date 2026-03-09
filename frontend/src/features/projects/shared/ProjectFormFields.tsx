import { useMemo, useState } from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import type { PersonOption, ProjectFormValues } from "../models/project.types";
import { SECURITY_LEVEL_OPTIONS } from "./projectFormConfig";
import styles from "./ProjectFormFields.module.css";

interface ProjectFormFieldsProps {
    control: Control<ProjectFormValues>;
    errors: FieldErrors<ProjectFormValues>;
    managers?: PersonOption[];
    employees?: PersonOption[];
    statusOptions?: Array<{ id: string; name: string }>;
}

function getPersonName(person: PersonOption): string {
    return (
        person.name ??
        `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim()
    ) || `#${person.id}`;
}

function toggleSelectedValue(values: string[], id: string): string[] {
    return values.includes(id)
        ? values.filter((v) => v !== id)
        : [...values, id];
}

function SectionLabel({
    step,
    title,
    description,
}: {
    step: number;
    title: string;
    description: string;
}) {
    return (
        <div className={styles.sectionLabel}>
            <span className={styles.step}>{step}</span>
            <div>
                <div className={styles.sectionTitle}>{title}</div>
                <div className={styles.sectionDesc}>{description}</div>
            </div>
        </div>
    );
}

function FieldGroup({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>{label}</label>
            {children}
            {error && <span className={styles.error}>{error}</span>}
            {hint && !error && <span className={styles.hint}>{hint}</span>}
        </div>
    );
}

function ProjectFormFields({
    control,
    errors,
    managers = [],
    employees = [],
    statusOptions = [],
}: ProjectFormFieldsProps): JSX.Element {
    const [employeeSearch, setEmployeeSearch] = useState("");

    const employeeOptions = useMemo(
        () =>
            employees
                .map((e) => ({ id: String(e.id), name: getPersonName(e) }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [employees]
    );

    const filteredEmployeeOptions = useMemo(() => {
        const q = employeeSearch.trim().toLowerCase();
        return q
            ? employeeOptions.filter((e) => e.name.toLowerCase().includes(q))
            : employeeOptions;
    }, [employeeOptions, employeeSearch]);

    return (
        <div className={styles.root}>
            {/* ── 1. Basics ── */}
            <div className={styles.section}>
                <SectionLabel step={1} title="Basics" description="Name, status, and classification." />
                <div className={styles.fields}>
                    <FieldGroup label="Project name" error={errors.name?.message}>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    className={`${styles.input}${errors.name ? ` ${styles.invalid}` : ""}`}
                                    placeholder="e.g. Q3 Infrastructure Upgrade"
                                />
                            )}
                        />
                    </FieldGroup>

                    <div className={`${styles.row} ${styles.row2}`}>
                        <FieldGroup label="Status" error={errors.status?.message}>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        className={`${styles.select}${errors.status ? ` ${styles.invalid}` : ""}`}
                                    >
                                        <option value="">Select status…</option>
                                        {statusOptions.map((o) => (
                                            <option key={o.id || o.name} value={o.id || o.name}>
                                                {o.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            />
                        </FieldGroup>

                        <FieldGroup
                            label="Security level"
                            hint='Use "Internal" unless the project contains sensitive data.'
                            error={errors.security_level?.message}
                        >
                            <Controller
                                name="security_level"
                                control={control}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        className={`${styles.select}${errors.security_level ? ` ${styles.invalid}` : ""}`}
                                    >
                                        {SECURITY_LEVEL_OPTIONS.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            />
                        </FieldGroup>
                    </div>
                </div>
            </div>

            {/* ── 2. People ── */}
            <div className={styles.section}>
                <SectionLabel step={2} title="People" description="Manager and assigned employees." />
                <div className={styles.fields}>
                    <FieldGroup label="Project manager" error={errors.managerId?.message}>
                        <Controller
                            name="managerId"
                            control={control}
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className={`${styles.select}${errors.managerId ? ` ${styles.invalid}` : ""}`}
                                >
                                    <option value="">Select project manager…</option>
                                    {managers.map((manager) => (
                                        <option key={manager.id} value={String(manager.id)}>
                                            {getPersonName(manager)}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                    </FieldGroup>

                    <Controller
                        name="employees"
                        control={control}
                        render={({ field }) => {
                            const selectedValues = (field.value ?? []).map(String);
                            const count = selectedValues.length;

                            return (
                                <FieldGroup label="Employees" error={errors.employees?.message}>
                                    <div className={styles.searchRow}>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="Search employees…"
                                            value={employeeSearch}
                                            onChange={(e) => setEmployeeSearch(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className={styles.clearBtn}
                                            disabled={!employeeSearch.trim()}
                                            onClick={() => setEmployeeSearch("")}
                                        >
                                            Clear
                                        </button>
                                    </div>

                                    <div
                                        className={`${styles.employeeList}${errors.employees ? ` ${styles.invalid}` : ""}`}
                                    >
                                        {employeeOptions.length === 0 ? (
                                            <div className={styles.emptyMsg}>No employees available.</div>
                                        ) : filteredEmployeeOptions.length === 0 ? (
                                            <div className={styles.emptyMsg}>
                                                No results for &ldquo;{employeeSearch}&rdquo;
                                            </div>
                                        ) : (
                                            filteredEmployeeOptions.map((emp) => (
                                                <label key={emp.id} className={styles.checkItem}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedValues.includes(emp.id)}
                                                        onChange={() =>
                                                            field.onChange(
                                                                toggleSelectedValue(selectedValues, emp.id)
                                                            )
                                                        }
                                                    />
                                                    {emp.name}
                                                </label>
                                            ))
                                        )}
                                    </div>

                                    <div className={styles.employeeFooter}>
                                        <span className={styles.count}>
                                            {count === 0
                                                ? "No employees selected"
                                                : `${count} employee${count !== 1 ? "s" : ""} selected`}
                                        </span>
                                        <button
                                            type="button"
                                            className={styles.deselectBtn}
                                            disabled={count === 0}
                                            onClick={() => field.onChange([])}
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                </FieldGroup>
                            );
                        }}
                    />
                </div>
            </div>

            {/* ── 3. Schedule ── */}
            <div className={styles.section}>
                <SectionLabel step={3} title="Schedule" description="Start and end dates." />
                <div className={styles.fields}>
                    <div className={`${styles.row} ${styles.row2}`}>
                        <FieldGroup label="Start date" error={errors.start_date?.message}>
                            <Controller
                                name="start_date"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="date"
                                        className={`${styles.input}${errors.start_date ? ` ${styles.invalid}` : ""}`}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value)}
                                    />
                                )}
                            />
                        </FieldGroup>

                        <FieldGroup label="End date" error={errors.end_date?.message}>
                            <Controller
                                name="end_date"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="date"
                                        className={`${styles.input}${errors.end_date ? ` ${styles.invalid}` : ""}`}
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value)}
                                    />
                                )}
                            />
                        </FieldGroup>
                    </div>
                </div>
            </div>

            {/* ── 4. Comments ── */}
            <div className={styles.section}>
                <SectionLabel step={4} title="Comments" description="Optional notes or context." />
                <div className={styles.fields}>
                    <Controller
                        name="comments"
                        control={control}
                        render={({ field }) => (
                            <textarea
                                {...field}
                                className={styles.textarea}
                                placeholder="Add any relevant notes, goals, or context for this project…"
                            />
                        )}
                    />
                </div>
            </div>
        </div>
    );
}

export default ProjectFormFields;