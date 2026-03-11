/**
 * @file API error message extraction helper.
 *
 * Centralises the logic for converting an unknown error thrown by the fetch
 * client into a user-facing string. Keeps controller hooks small and ensures
 * Create and Edit surfaces display backend validation errors consistently.
 *
 * @module shared/getApiErrorMessage
 */

/**
 * Minimal shape of an API error as thrown by the fetch client.
 *
 * The fetch client may populate either the Axios-style `response` sub-object
 * or the flat `status`/`data` fields directly. Both shapes are handled.
 *
 * Using a typed interface + type guard instead of inline `as` casts because:
 * - Inline casts would repeat the same complex type across multiple call sites.
 * - With strict mode enabled, a type guard is the correct way to narrow `unknown`.
 * - This interface documents exactly what the fetch client actually throws.
 */
interface ApiError {
    /**
     * Axios-style error shape: `error.response.status` / `error.response.data`.
     */
    response?: {
        status?: number;
        data?: Record<string, string[] | string>;
    };
    /**
     * Flat error shape used directly by the fetch client:
     * `error.status` / `error.data`.
     */
    status?: number;
    data?: Record<string, string[] | string>;
}

/**
 * Narrows an unknown value to {@link ApiError}.
 *
 * Only checks that the value is a non-null object — field-level checks are
 * deferred to the body-parsing logic in {@link getApiErrorMessage}.
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

    const body = err.response?.data ?? err.data;
    const status = err.response?.status ?? err.status;

    if (body !== undefined && typeof body === "object" && !Array.isArray(body)) {
        const messages = Object.values(body)
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
