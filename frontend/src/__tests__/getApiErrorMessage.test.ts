import { describe, expect, test } from "vitest";

import { getApiErrorMessage } from "../features/projects/shared/getApiErrorMessage";

describe("getApiErrorMessage", () => {
    // ── Non-object errors ────────────────────────────────────────────────────

    test("returns the fallback message when err is null", () => {
        expect(getApiErrorMessage(null, "Something went wrong")).toBe("Something went wrong");
    });

    test("returns the fallback message when err is undefined", () => {
        expect(getApiErrorMessage(undefined, "Something went wrong")).toBe("Something went wrong");
    });

    test("returns the fallback message when err is a plain string", () => {
        expect(getApiErrorMessage("oops", "Something went wrong")).toBe("Something went wrong");
    });

    test("returns the fallback message when err is a number", () => {
        expect(getApiErrorMessage(42, "Something went wrong")).toBe("Something went wrong");
    });

    // ── Status-only errors (no body) ─────────────────────────────────────────

    test("appends status code from err.response.status when no field messages exist", () => {
        const err = { response: { status: 500 } };
        expect(getApiErrorMessage(err, "Request failed")).toBe("Request failed (500).");
    });

    test("appends status code from err.status (direct shape) when no field messages exist", () => {
        const err = { status: 403 };
        expect(getApiErrorMessage(err, "Request failed")).toBe("Request failed (403).");
    });

    test("prefers err.response.status over err.status when both exist", () => {
        const err = { response: { status: 422 }, status: 500 };
        expect(getApiErrorMessage(err, "Request failed")).toBe("Request failed (422).");
    });

    // ── Field-level validation errors ────────────────────────────────────────

    test("flattens single field array into a message string", () => {
        const err = { response: { status: 400, data: { name: ["This field is required."] } } };
        expect(getApiErrorMessage(err, "Request failed")).toBe("This field is required.");
    });

    test("flattens multiple fields into a joined message string", () => {
        const err = {
            response: {
                status: 400,
                data: {
                    name: ["This field is required."],
                    employees: ["Select at least one employee."],
                },
            },
        };
        expect(getApiErrorMessage(err, "Request failed")).toBe(
            "This field is required. Select at least one employee."
        );
    });

    test("handles string values (not arrays) in the data body", () => {
        const err = { response: { status: 400, data: { detail: "Permission denied." } } };
        expect(getApiErrorMessage(err, "Request failed")).toBe("Permission denied.");
    });

    test("reads field messages from err.data (direct shape) when no response wrapper", () => {
        const err = { status: 400, data: { name: ["Name is too long."] } };
        expect(getApiErrorMessage(err, "Request failed")).toBe("Name is too long.");
    });

    test("prefers err.response.data over err.data when both are present", () => {
        const err = {
            response: { status: 400, data: { name: ["From response.data."] } },
            data: { name: ["From data."] },
        };
        expect(getApiErrorMessage(err, "Request failed")).toBe("From response.data.");
    });

    test("falls back to status code when body is present but all values are empty", () => {
        const err = { response: { status: 400, data: { name: [""] } } };
        expect(getApiErrorMessage(err, "Request failed")).toBe("Request failed (400).");
    });

    test("falls back to fallback message when body is an empty object", () => {
        const err = { response: { status: 400, data: {} } };
        expect(getApiErrorMessage(err, "Request failed")).toBe("Request failed (400).");
    });

    // ── Bare object — no status, no body ─────────────────────────────────────

    test("returns the fallback message when err is an empty object", () => {
        expect(getApiErrorMessage({}, "Something went wrong")).toBe("Something went wrong");
    });

    test("returns the fallback message when err is an Error instance with no status", () => {
        expect(getApiErrorMessage(new Error("network error"), "Something went wrong")).toBe(
            "Something went wrong"
        );
    });
});
