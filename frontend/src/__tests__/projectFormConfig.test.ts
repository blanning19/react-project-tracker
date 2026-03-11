import { describe, expect, test } from "vitest";
import type { ProjectRecord } from "../features/projects/models/project.types";
import {
    DEFAULT_VALUES,
    formToPayload,
    PROJECT_SCHEMA,
    projectToFormValues,
    SECURITY_LEVEL_OPTIONS,
    STATUS_OPTIONS,
} from "../features/projects/shared/projectFormConfig";

// ── Static config ────────────────────────────────────────────────────────────

describe("STATUS_OPTIONS", () => {
    test("contains exactly the four expected statuses", () => {
        const ids = STATUS_OPTIONS.map((o) => o.id);
        expect(ids).toEqual(["Active", "On Hold", "Completed", "Cancelled"]);
    });
});

describe("SECURITY_LEVEL_OPTIONS", () => {
    test("contains exactly the four expected security levels", () => {
        const ids = SECURITY_LEVEL_OPTIONS.map((o) => o.id);
        expect(ids).toEqual(["Public", "Internal", "Confidential", "Restricted"]);
    });
});

describe("DEFAULT_VALUES", () => {
    test("has empty strings for all text fields", () => {
        expect(DEFAULT_VALUES.name).toBe("");
        expect(DEFAULT_VALUES.comments).toBe("");
        expect(DEFAULT_VALUES.status).toBe("");
        expect(DEFAULT_VALUES.managerId).toBe("");
        expect(DEFAULT_VALUES.start_date).toBe("");
        expect(DEFAULT_VALUES.end_date).toBe("");
    });

    test("defaults security_level to Internal", () => {
        expect(DEFAULT_VALUES.security_level).toBe("Internal");
    });

    test("defaults employees to an empty array", () => {
        expect(DEFAULT_VALUES.employees).toEqual([]);
    });
});

// ── PROJECT_SCHEMA validation ────────────────────────────────────────────────

describe("PROJECT_SCHEMA", () => {
    const validData = {
        name: "My Project",
        managerId: "1",
        status: "Active",
        employees: ["10"],
        comments: "Some notes",
        start_date: "2026-01-01",
        end_date: "2026-06-30",
        security_level: "Internal" as const,
    };

    test("accepts a fully valid object", async () => {
        await expect(PROJECT_SCHEMA.validate(validData)).resolves.toBeDefined();
    });

    test("rejects when name is missing", async () => {
        const data = { ...validData, name: "" };
        await expect(PROJECT_SCHEMA.validate(data)).rejects.toThrow("Name is a required field");
    });

    test("rejects when managerId is missing", async () => {
        const data = { ...validData, managerId: "" };
        await expect(PROJECT_SCHEMA.validate(data)).rejects.toThrow(
            "Project manager is a required field"
        );
    });

    test("rejects when status is not a valid option", async () => {
        const data = { ...validData, status: "Pending" };
        await expect(PROJECT_SCHEMA.validate(data)).rejects.toThrow(
            "Please select a valid status"
        );
    });

    test("rejects when employees array is empty", async () => {
        const data = { ...validData, employees: [] };
        await expect(PROJECT_SCHEMA.validate(data)).rejects.toThrow(
            "Pick at least one option from the select field"
        );
    });

    test("rejects when start_date is missing", async () => {
        const data = { ...validData, start_date: "" };
        await expect(PROJECT_SCHEMA.validate(data)).rejects.toThrow(
            "Start date is a required field"
        );
    });

    test("rejects when end_date is missing", async () => {
        const data = { ...validData, end_date: "" };
        await expect(PROJECT_SCHEMA.validate(data)).rejects.toThrow(
            "End date is a required field"
        );
    });

    test("rejects when end_date is before start_date", async () => {
        const data = { ...validData, start_date: "2026-06-01", end_date: "2026-01-01" };
        await expect(PROJECT_SCHEMA.validate(data)).rejects.toThrow(
            "The end date can not be before the start date"
        );
    });

    test("accepts when end_date equals start_date", async () => {
        const data = { ...validData, start_date: "2026-06-01", end_date: "2026-06-01" };
        await expect(PROJECT_SCHEMA.validate(data)).resolves.toBeDefined();
    });

    test("rejects when security_level is not a valid option", async () => {
        const data = { ...validData, security_level: "TopSecret" };
        await expect(PROJECT_SCHEMA.validate(data)).rejects.toThrow("Security level is invalid");
    });
});

// ── projectToFormValues ──────────────────────────────────────────────────────

describe("projectToFormValues", () => {
    test("maps flat primitive fields correctly", () => {
        const result = projectToFormValues({
            id: 1,
            name: "Alpha",
            comments: "Some notes",
            status: "Active",
            manager: { id: 3, name: "Manager 3" },
            employees: [
                { id: 10, name: "Employee 10" },
                { id: 11, name: "Employee 11" },
            ],
            start_date: "2026-03-01",
            end_date: "2026-03-31",
            security_level: "Confidential",
        });

        expect(result.name).toBe("Alpha");
        expect(result.comments).toBe("Some notes");
        expect(result.status).toBe("Active");
        expect(result.security_level).toBe("Confidential");
    });

    test("converts manager object to managerId string", () => {
        const result = projectToFormValues({
            id: 1,
            name: "Alpha",
            comments: "",
            status: "Active",
            manager: { id: 5, first_name: "Alice", last_name: "Manager" },
            employees: [],
            start_date: "2026-03-01",
            end_date: "2026-03-31",
            security_level: "Internal",
        });

        expect(result.managerId).toBe("5");
    });

    test("converts employee objects to string ids", () => {
        const result = projectToFormValues({
            id: 1,
            name: "Alpha",
            comments: "",
            status: "Active",
            manager: { id: 3, name: "Manager 3" },
            employees: [
                { id: 10, first_name: "Bob", last_name: "One" },
                { id: 11, first_name: "Carol", last_name: "Two" },
            ],
            start_date: "2026-03-01",
            end_date: "2026-03-31",
            security_level: "Internal",
        });

        expect(result.employees).toEqual(["10", "11"]);
    });

    test("normalises dates to YYYY-MM-DD format", () => {
        const result = projectToFormValues({
            id: 1,
            name: "Alpha",
            comments: "",
            status: "Active",
            manager: { id: 3, name: "Manager 3" },
            employees: [],
            start_date: "2026-03-01",
            end_date: "2026-12-31",
            security_level: "Internal",
        });

        expect(result.start_date).toBe("2026-03-01");
        expect(result.end_date).toBe("2026-12-31");
    });

    test("returns empty strings for null/missing dates", () => {
        const project = {
            id: 1,
            name: "Alpha",
            comments: "",
            status: "Active",
            manager: { id: 3, name: "Manager 3" },
            employees: [],
            start_date: null,
            end_date: null,
            security_level: "Internal",
        } as unknown as ProjectRecord;

        const result = projectToFormValues(project);

        expect(result.start_date).toBe("");
        expect(result.end_date).toBe("");
    });

    test("defaults security_level to Internal when missing", () => {
        const project = {
            id: 1,
            name: "Alpha",
            comments: "",
            status: "Active",
            manager: { id: 3, name: "Manager 3" },
            employees: [],
            start_date: "2026-03-01",
            end_date: "2026-03-31",
            security_level: null,
        } as unknown as ProjectRecord;

        const result = projectToFormValues(project);

        expect(result.security_level).toBe("Internal");
    });

    test("defaults comments to empty string when missing", () => {
        const project = {
            id: 1,
            name: "Alpha",
            comments: null,
            status: "Active",
            manager: { id: 3, name: "Manager 3" },
            employees: [],
            start_date: "2026-03-01",
            end_date: "2026-03-31",
            security_level: "Internal",
        } as unknown as ProjectRecord;

        const result = projectToFormValues(project);

        expect(result.comments).toBe("");
    });
});

// ── formToPayload ────────────────────────────────────────────────────────────

describe("formToPayload", () => {
    const baseForm = {
        name: "My Project",
        comments: "Notes here",
        status: "Active",
        managerId: "3",
        employees: ["10", "11"],
        start_date: "2026-03-01",
        end_date: "2026-12-31",
        security_level: "Confidential" as const,
    };

    test("converts managerId string to backend manager number", () => {
        const payload = formToPayload(baseForm);
        expect(payload.manager).toBe(3);
        expect(typeof payload.manager).toBe("number");
    });

    test("converts employee string ids to numbers", () => {
        const payload = formToPayload(baseForm);
        expect(payload.employees).toEqual([10, 11]);
    });

    test("passes name, comments, status, and security_level through unchanged", () => {
        const payload = formToPayload(baseForm);
        expect(payload.name).toBe("My Project");
        expect(payload.comments).toBe("Notes here");
        expect(payload.status).toBe("Active");
        expect(payload.security_level).toBe("Confidential");
    });

    test("formats start_date as YYYY-MM-DD", () => {
        const payload = formToPayload(baseForm);
        expect(payload.start_date).toBe("2026-03-01");
    });

    test("formats end_date as YYYY-MM-DD", () => {
        const payload = formToPayload(baseForm);
        expect(payload.end_date).toBe("2026-12-31");
    });

    test("sets start_date to null when empty string", () => {
        const payload = formToPayload({ ...baseForm, start_date: "" });
        expect(payload.start_date).toBeNull();
    });

    test("sets end_date to null when empty string", () => {
        const payload = formToPayload({ ...baseForm, end_date: "" });
        expect(payload.end_date).toBeNull();
    });
});