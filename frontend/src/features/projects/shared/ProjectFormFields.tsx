import { useMemo, useState } from "react";
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

function SectionLabel({ step, title, description }: { step: number; title: string; description: string }) {
    return (
        <div className="pf-section-label">
            <span className="pf-step">{step}</span>
            <div>
                <div className="pf-section-title">{title}</div>
                <div className="pf-section-desc">{description}</div>
            </div>
        </div>
    );
}

function FieldGroup({ label, hint, error, children }: {
    label: string;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="pf-field">
            <label className="pf-label">{label}</label>
            {children}
            {error && <span className="pf-error">{error}</span>}
            {hint && !error && <span className="pf-hint">{hint}</span>}
        </div>
    );
}

const PF_STYLES = `
    /* ── Light mode tokens ── */
    :root {
        --pf-text:          #1a1a1a;
        --pf-text-muted:    #555555;
        --pf-text-faint:    #888888;
        --pf-text-hint:     #aaaaaa;
        --pf-text-empty:    #bbbbbb;
        --pf-bg:            #ffffff;
        --pf-bg-list:       #fafaf8;
        --pf-border:        #dddddd;
        --pf-border-sec:    #e8e4df;
        --pf-step-bg:       #1a1a1a;
        --pf-step-color:    #ffffff;
        --pf-focus-ring:    rgba(26,26,26,0.07);
        --pf-hover-bg:      #f0ede9;
        --pf-error:         #c0392b;
        --pf-placeholder:   #c0bbb5;
    }

    /* ── Dark mode tokens ── */
    [data-bs-theme="dark"] {
        --pf-text:          #e8e4df;
        --pf-text-muted:    #aaaaaa;
        --pf-text-faint:    #777777;
        --pf-text-hint:     #555555;
        --pf-text-empty:    #555555;
        --pf-bg:            #1e1e1e;
        --pf-bg-list:       #252525;
        --pf-border:        #3a3a3a;
        --pf-border-sec:    #2e2e2e;
        --pf-step-bg:       #e8e4df;
        --pf-step-color:    #1a1a1a;
        --pf-focus-ring:    rgba(232,228,223,0.10);
        --pf-hover-bg:      #2a2a2a;
        --pf-error:         #e57373;
        --pf-placeholder:   #4a4a4a;
    }

    /* ── Layout ── */
    .pf-root {
        display: flex;
        flex-direction: column;
        font-family: 'Georgia', 'Times New Roman', serif;
        max-width: 780px;
    }
    .pf-section {
        display: grid;
        grid-template-columns: 220px 1fr;
        border-bottom: 1px solid var(--pf-border-sec);
        padding: 32px 0;
    }
    .pf-section:last-child { border-bottom: none; }

    /* ── Left column ── */
    .pf-section-label {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding-right: 32px;
        padding-top: 2px;
    }
    .pf-step {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: var(--pf-step-bg);
        color: var(--pf-step-color);
        font-family: 'Courier New', monospace;
        font-size: 12px;
        font-weight: bold;
        flex-shrink: 0;
        margin-top: 2px;
        transition: background 0.2s, color 0.2s;
    }
    .pf-section-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--pf-text);
        letter-spacing: 0.01em;
        line-height: 1.3;
    }
    .pf-section-desc {
        font-size: 12.5px;
        color: var(--pf-text-faint);
        margin-top: 3px;
        line-height: 1.5;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-style: italic;
    }

    /* ── Right column ── */
    .pf-fields { display: flex; flex-direction: column; gap: 20px; }
    .pf-row { display: grid; gap: 16px; }
    .pf-row-2 { grid-template-columns: 1fr 1fr; }
    .pf-row-3 { grid-template-columns: 1fr 1fr 1fr; }
    .pf-field { display: flex; flex-direction: column; gap: 5px; }

    .pf-label {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--pf-text-muted);
    }
    .pf-hint {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 11.5px;
        color: var(--pf-text-hint);
        font-style: italic;
    }
    .pf-error {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 11.5px;
        color: var(--pf-error);
    }

    /* ── Inputs ── */
    .pf-input, .pf-select, .pf-textarea {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 14px;
        color: var(--pf-text);
        background: var(--pf-bg);
        border: 1.5px solid var(--pf-border);
        border-radius: 6px;
        padding: 9px 12px;
        transition: border-color 0.15s, box-shadow 0.15s, background 0.2s, color 0.2s;
        outline: none;
        width: 100%;
        box-sizing: border-box;
    }
    .pf-input:focus, .pf-select:focus, .pf-textarea:focus {
        border-color: var(--pf-text);
        box-shadow: 0 0 0 3px var(--pf-focus-ring);
    }
    .pf-input.is-invalid, .pf-select.is-invalid, .pf-textarea.is-invalid {
        border-color: var(--pf-error);
    }
    .pf-input::placeholder, .pf-textarea::placeholder {
        color: var(--pf-placeholder);
    }
    .pf-select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 32px;
        cursor: pointer;
    }
    .pf-textarea { resize: vertical; min-height: 110px; line-height: 1.6; }

    /* ── Employee picker ── */
    .pf-search-row { display: flex; gap: 8px; }
    .pf-search-row .pf-input { flex: 1; }

    .pf-clear-btn {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 12px;
        padding: 0 14px;
        background: none;
        border: 1.5px solid var(--pf-border);
        border-radius: 6px;
        color: var(--pf-text-faint);
        cursor: pointer;
        white-space: nowrap;
        transition: border-color 0.15s, color 0.15s;
    }
    .pf-clear-btn:hover:not(:disabled) { border-color: var(--pf-text); color: var(--pf-text); }
    .pf-clear-btn:disabled { opacity: 0.35; cursor: default; }

    .pf-employee-list {
        border: 1.5px solid var(--pf-border);
        border-radius: 6px;
        max-height: 220px;
        overflow-y: auto;
        padding: 6px 4px;
        background: var(--pf-bg-list);
        transition: background 0.2s;
    }
    .pf-employee-list.is-invalid { border-color: var(--pf-error); }

    .pf-check-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 10px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.1s;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 13.5px;
        color: var(--pf-text);
        user-select: none;
    }
    .pf-check-item:hover { background: var(--pf-hover-bg); }
    .pf-check-item input[type="checkbox"] {
        width: 15px;
        height: 15px;
        accent-color: var(--pf-text);
        cursor: pointer;
        flex-shrink: 0;
    }

    .pf-employee-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 8px;
    }
    .pf-count {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 12px;
        color: var(--pf-text-hint);
    }
    .pf-deselect-btn {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 12px;
        background: none;
        border: none;
        color: var(--pf-text-faint);
        cursor: pointer;
        padding: 0;
        text-decoration: underline;
        text-underline-offset: 2px;
        transition: color 0.15s;
    }
    .pf-deselect-btn:hover:not(:disabled) { color: var(--pf-error); }
    .pf-deselect-btn:disabled { opacity: 0.3; cursor: default; }

    .pf-empty-msg {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 13px;
        color: var(--pf-text-empty);
        padding: 14px 10px;
        text-align: center;
        font-style: italic;
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
        .pf-section { grid-template-columns: 1fr; gap: 18px; }
        .pf-row-2, .pf-row-3 { grid-template-columns: 1fr; }
        .pf-section-label { padding-right: 0; }
    }
`;

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
                .map((e) => ({ id: String(e.id), name: getPersonName(e) }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [employees]
    );

    const filteredEmployeeOptions = useMemo(() => {
        const q = employeeSearch.trim().toLowerCase();
        return q ? employeeOptions.filter((e) => e.name.toLowerCase().includes(q)) : employeeOptions;
    }, [employeeOptions, employeeSearch]);

    return (
        <>
            <style>{PF_STYLES}</style>

            <div className="pf-root">

                {/* ── 1. Basics ── */}
                <div className="pf-section">
                    <SectionLabel step={1} title="Basics" description="Name, status, and classification." />
                    <div className="pf-fields">
                        <FieldGroup label="Project name" error={errors.name?.message}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className={`pf-input${errors.name ? " is-invalid" : ""}`}
                                        placeholder="e.g. Q3 Infrastructure Upgrade"
                                    />
                                )}
                            />
                        </FieldGroup>

                        <div className="pf-row pf-row-2">
                            <FieldGroup label="Status" error={errors.status?.message}>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <select {...field} className={`pf-select${errors.status ? " is-invalid" : ""}`}>
                                            <option value="">Select status…</option>
                                            {statusOptions.map((o) => (
                                                <option key={o.id || o.name} value={o.id || o.name}>{o.name}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                            </FieldGroup>

                            <FieldGroup
                                label="Security level"
                                hint={'Use "Internal" unless the project contains sensitive data.'}
                                error={errors.security_level?.message}
                            >
                                <Controller
                                    name="security_level"
                                    control={control}
                                    render={({ field }) => (
                                        <select {...field} className={`pf-select${errors.security_level ? " is-invalid" : ""}`}>
                                            {SECURITY_LEVEL_OPTIONS.map((o) => (
                                                <option key={o.id} value={o.id}>{o.name}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                            </FieldGroup>
                        </div>
                    </div>
                </div>

                {/* ── 2. People ── */}
                <div className="pf-section">
                    <SectionLabel step={2} title="People" description="Manager and assigned employees." />
                    <div className="pf-fields">
                        <FieldGroup label="Project manager" error={errors.projectmanager?.message}>
                            <Controller
                                name="projectmanager"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className={`pf-select${errors.projectmanager ? " is-invalid" : ""}`}>
                                        <option value="">Select project manager…</option>
                                        {projectManagers.map((pm) => (
                                            <option key={pm.id} value={String(pm.id)}>{getPersonName(pm)}</option>
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
                                        <div className="pf-search-row">
                                            <input
                                                type="text"
                                                className="pf-input"
                                                placeholder="Search employees…"
                                                value={employeeSearch}
                                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="pf-clear-btn"
                                                disabled={!employeeSearch.trim()}
                                                onClick={() => setEmployeeSearch("")}
                                            >
                                                Clear
                                            </button>
                                        </div>

                                        <div className={`pf-employee-list${errors.employees ? " is-invalid" : ""}`}>
                                            {employeeOptions.length === 0 ? (
                                                <div className="pf-empty-msg">No employees available.</div>
                                            ) : filteredEmployeeOptions.length === 0 ? (
                                                <div className="pf-empty-msg">No results for &ldquo;{employeeSearch}&rdquo;</div>
                                            ) : (
                                                filteredEmployeeOptions.map((emp) => (
                                                    <label key={emp.id} className="pf-check-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedValues.includes(emp.id)}
                                                            onChange={() =>
                                                                field.onChange(toggleSelectedValue(selectedValues, emp.id))
                                                            }
                                                        />
                                                        {emp.name}
                                                    </label>
                                                ))
                                            )}
                                        </div>

                                        <div className="pf-employee-footer">
                                            <span className="pf-count">
                                                {count === 0 ? "No employees selected" : `${count} employee${count !== 1 ? "s" : ""} selected`}
                                            </span>
                                            <button
                                                type="button"
                                                className="pf-deselect-btn"
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
                <div className="pf-section">
                    <SectionLabel step={3} title="Schedule" description="Start and end dates." />
                    <div className="pf-fields">
                        <div className="pf-row pf-row-2">
                            <FieldGroup label="Start date" error={errors.start_date?.message}>
                                <Controller
                                    name="start_date"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            type="date"
                                            className={`pf-input${errors.start_date ? " is-invalid" : ""}`}
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
                                            className={`pf-input${errors.end_date ? " is-invalid" : ""}`}
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
                <div className="pf-section">
                    <SectionLabel step={4} title="Comments" description="Optional notes or context." />
                    <div className="pf-fields">
                        <Controller
                            name="comments"
                            control={control}
                            render={({ field }) => (
                                <textarea
                                    {...field}
                                    className="pf-textarea"
                                    placeholder="Add any relevant notes, goals, or context for this project…"
                                />
                            )}
                        />
                    </div>
                </div>

            </div>
        </>
    );
}

export default ProjectFormFields;
