import { describe, expect, test } from "vitest";
import { formToPayload, projectToFormValues } from "../features/projects/shared/projectFormConfig";

describe("projectFormConfig", () => {
    test("formToPayload includes security_level", () => {
        const payload = formToPayload({
            name: "Test Project",
            comments: "",
            status: "Open",
            projectmanager: "5",
            employees: ["1", "2"],
            start_date: "2026-03-04",
            end_date: "2026-03-05",
            security_level: "Restricted",
        });

        expect(payload).toEqual(expect.objectContaining({
            projectmanager: 5,
            employees: [1, 2],
            security_level: "Restricted",
        }));
    });

    test("projectToFormValues carries forward security_level from the API record", () => {
        const formValues = projectToFormValues({
            id: 42,
            name: "Test Project",
            comments: "Has data",
            status: "Open",
            projectmanager: { id: 3, first_name: "Alice", last_name: "Manager" },
            employees: [{ id: 7, first_name: "Bob", last_name: "Employee" }],
            start_date: "2026-03-04",
            end_date: "2026-03-05",
            security_level: "Confidential",
        });

        expect(formValues).toEqual(expect.objectContaining({
            projectmanager: "3",
            employees: ["7"],
            security_level: "Confidential",
        }));
    });
});
