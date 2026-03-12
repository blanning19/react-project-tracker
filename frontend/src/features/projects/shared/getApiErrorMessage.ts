/**
 * @file API error message extraction helper.
 *
 * Centralises the logic for converting an unknown error thrown by the fetch
 * client into a user-facing string. Keeps controller hooks small and ensures
 * Create and Edit surfaces display backend validation errors consistently.
 *
 * @module shared/getApiErrorMessage
 */

import type { ApiError } from "../../../shared/types/http";

/**
 * Narrows an unknown value to {@link ApiError}.
 *
 * Only checks that the value is a non-null object — field-level checks are
 * deferred to the body-parsing logic in {@link getApiErrorMessage}.
 *
 * The shared `ApiError` from `http.ts` types `data` as `unknown`, which is
 * correct: the backend can return plain strings (`{"detail": "Not found."}`),
 * arrays, or nested validation objects. Runtime narrowing below handles all
 * shapes safely.
 *
 * @param err - The value to test.
 * @returns `true` if `err` is a non-null object.
 */
function isApiError(err: unknown): err is ApiError {
    return typeof err === "object" && err !== null;
}

/**
 * Converts an unknown API error into a user-friendly message string.
 *
 * ### Resolution order
 * 1. **Field-level validation messages** — if the backend returned a
 *    validation object (e.g. `{ name: ["This field is required."] }`),
 *    all values are flattened into one readable string.
 * 2. **HTTP status fallback** — if an HTTP status is present but no field
 *    messages are available, the fallback message is returned with the
 *    status code appended.
 * 3. **Plain fallback** — if the error contains nothing recognisable, the
 *    `fallbackMessage` is returned as-is.
 *
 * ### Backend error shapes handled
 * - Field validation: `{ name: ["Too long."], employees: ["Pick one."] }`
 * - Detail string:    `{ detail: "Not found." }` (404, 400 without fields)
 * - Plain string:     `{ detail: "No refresh token provided." }` (logout 400)
 *
 * @param err - The unknown error thrown by the API layer.
 * @param fallbackMessage - The default message to show if the error cannot
 *   be parsed into something more specific.
 * @returns A user-facing error message string.
 *
 * @example
 * ```ts
 * // Field-level errors from DRF validation
 * getApiErrorMessage(
 *   { response: { data: { name: ["This field is required."], employees: ["Pick at least one."] } } },
 *   "Request failed"
 * );
 * // → "This field is required. Pick at least one."
 *
 * // HTTP status without a body
 * getApiErrorMessage({ status: 500 }, "Request failed");
 * // → "Request failed (500)."
 *
 * // Unknown / network error
 * getApiErrorMessage(new Error("Network failure"), "Request failed");
 * // → "Request failed"
 * ```
 */
export function getApiErrorMessage(err: unknown, fallbackMessage: string): string {
    if (!isApiError(err)) {
        return fallbackMessage;
    }

    // Support both Axios-style (err.response.data) and flat (err.data) shapes.
    const body = err.response?.data ?? err.data;
    const status = err.response?.status ?? err.status;

    // body is `unknown` from the shared ApiError type — narrow to a plain
    // object before iterating over its values.
    if (
        body !== undefined &&
        body !== null &&
        typeof body === "object" &&
        !Array.isArray(body)
    ) {
        const messages = Object.values(body as Record<string, unknown>)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean)
            .map(String);

        if (messages.length > 0) {
            return messages.join(" ");
        }
    }

    if (status !== undefined) {
        return `${fallbackMessage} (${status}).`;
    }

    return fallbackMessage;
}
