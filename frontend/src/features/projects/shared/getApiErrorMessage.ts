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
export function getApiErrorMessage(err: unknown, fallbackMessage: string): string {
    const body =
        (err as {
            response?: { data?: Record<string, string[] | string> };
            data?: Record<string, string[] | string>;
        })?.response?.data ??
        (err as { data?: Record<string, string[] | string> })?.data;

    const status =
        (err as { response?: { status?: number }; status?: number })?.response?.status ??
        (err as { status?: number })?.status;

    /**
     * If the backend returned a validation object, flatten all message values
     * into one display string.
     *
     * Example:
     * {
     *   name: ["This field is required."],
     *   employees: ["Select at least one employee."]
     * }
     *
     * becomes:
     * "This field is required. Select at least one employee."
     */
    if (body && typeof body === "object" && !Array.isArray(body)) {
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
     * return the provided fallback with the status appended.
     */
    if (status) {
        return `${fallbackMessage} (${status}).`;
    }

    /**
     * Final fallback when the error does not contain a recognizable API shape.
     */
    return fallbackMessage;
}