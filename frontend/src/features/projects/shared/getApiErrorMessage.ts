/**
 * Converts an unknown API error into a user-friendly message string.
 *
 * Why this helper exists:
 * - keeps controller hooks smaller and easier to read
 * - ensures Create and Edit display backend errors consistently
 * - centralizes validation-error parsing in one place
 *
 * Behavior:
 * - if the backend returned field-level validation messages, those are flattened
 *   into one readable string
 * - if an HTTP status exists but no field messages are available, a fallback
 *   message with the status code is returned
 * - if nothing useful is available, the provided fallback message is returned
 *
 * Params:
 * - err: the unknown error thrown by the API layer
 * - fallbackMessage: the default message to show if the error cannot be parsed
 *
 * Returns:
 * - a user-facing error message string
 */

/**
 * Minimal shape of an API error as thrown by the fetch client.
 *
 * Using a typed interface + type guard instead of inline `as` casts because:
 * - inline casts repeated the same complex type 4 times across two statements
 * - with strict mode enabled, a type guard is the correct way to narrow `unknown`
 * - this shape documents what the fetch client actually throws
 */
interface ApiError {
    /** Axios-style: error.response.status / error.response.data */
    response?: {
        status?: number;
        data?: Record<string, string[] | string>;
    };
    /** Direct-style: error.status / error.data (fetch client may use this shape) */
    status?: number;
    data?: Record<string, string[] | string>;
}

function isApiError(err: unknown): err is ApiError {
    return typeof err === "object" && err !== null;
}

export function getApiErrorMessage(err: unknown, fallbackMessage: string): string {
    if (!isApiError(err)) {
        return fallbackMessage;
    }

    const body = err.response?.data ?? err.data;
    const status = err.response?.status ?? err.status;

    /**
     * If the backend returned a validation object, flatten all message values
     * into one display string.
     *
     * Example input:
     * {
     *   name: ["This field is required."],
     *   employees: ["Select at least one employee."]
     * }
     *
     * Example output:
     * "This field is required. Select at least one employee."
     */
    if (body !== undefined && typeof body === "object" && !Array.isArray(body)) {
        const messages = Object.values(body)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean)
            .map(String);

        if (messages.length > 0) {
            return messages.join(" ");
        }
    }

    /**
     * If we know the HTTP status but do not have structured field messages,
     * return the fallback with the status appended so the developer has context.
     */
    if (status !== undefined) {
        return `${fallbackMessage} (${status}).`;
    }

    /**
     * Final fallback when the error does not contain a recognizable API shape.
     */
    return fallbackMessage;
}
