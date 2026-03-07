import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../shared/auth/tokens", () => ({
    tokenStore: {
        getAccess:  vi.fn(() => "test-access-token"),
        getRefresh: vi.fn(() => "test-refresh-token"),
        setAccess:  vi.fn(),
        setRefresh: vi.fn(),
        clear:      vi.fn(),
    },
}));

vi.mock("../shared/auth/mode", () => ({
    isCookieAuth: false,
}));

import FetchInstance, { registerSessionExpiredHandler } from "../shared/http/fetchClient";
import { tokenStore } from "../shared/auth/tokens";

// ── Response factory ─────────────────────────────────────────────────────────
//
// Matches the plain-object response pattern used by fetchClient_authHeader and
// fetchClient_refresh tests so all three files behave consistently.

function makeResponse({
    status = 200,
    body = null as unknown,
    contentType = "application/json",
} = {}) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: (key: string) =>
                key.toLowerCase() === "content-type" ? contentType : "",
            entries: () => [["content-type", contentType]],
        },
        text: async () => {
            if (body == null) return "";
            return typeof body === "string" ? body : JSON.stringify(body);
        },
        json: async () => body,
    };
}

function stubFetch(...responses: ReturnType<typeof makeResponse>[]) {
    const mock = vi.fn();
    responses.forEach((r) => mock.mockResolvedValueOnce(r));
    globalThis.fetch = mock as unknown as typeof fetch;
    return mock;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("fetchClient — extended coverage", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        registerSessionExpiredHandler(() => {});
    });

    // ── HTTP verb helpers ────────────────────────────────────────────────────

    test("GET returns parsed JSON data and ok:true on 200", async () => {
        stubFetch(makeResponse({ status: 200, body: { id: 1, name: "Alpha" } }));

        const result = await FetchInstance.get("projects/");

        expect(result.ok).toBe(true);
        expect(result.status).toBe(200);
        expect(result.data).toEqual({ id: 1, name: "Alpha" });
    });

    test("POST sends serialised JSON body and returns response data", async () => {
        const mock = stubFetch(makeResponse({ status: 201, body: { id: 42 } }));

        const result = await FetchInstance.post("projects/", { name: "New Project" });

        expect(result.status).toBe(201);
        expect(result.data).toEqual({ id: 42 });
        const [, options] = mock.mock.calls[0] as [URL, RequestInit];
        expect(JSON.parse(options.body as string)).toEqual({ name: "New Project" });
    });

    test("PUT sends serialised JSON body and returns response data", async () => {
        const mock = stubFetch(makeResponse({ status: 200, body: { id: 42, name: "Updated" } }));

        await FetchInstance.put("projects/42/", { name: "Updated" });

        const [, options] = mock.mock.calls[0] as [URL, RequestInit];
        expect(JSON.parse(options.body as string)).toEqual({ name: "Updated" });
    });

    test("PATCH sends serialised JSON body and returns response data", async () => {
        const mock = stubFetch(makeResponse({ status: 200, body: { id: 42, status: "Completed" } }));

        await FetchInstance.patch("projects/42/", { status: "Completed" });

        const [, options] = mock.mock.calls[0] as [URL, RequestInit];
        expect(JSON.parse(options.body as string)).toEqual({ status: "Completed" });
    });

    test("DELETE returns ok:true", async () => {
        stubFetch(makeResponse({ status: 200, body: null }));

        const result = await FetchInstance.delete("projects/42/");

        expect(result.ok).toBe(true);
        expect(result.status).toBe(200);
    });

    // ── Query-param serialisation ────────────────────────────────────────────

    test("appends params as query string on GET", async () => {
        const mock = stubFetch(makeResponse({ body: [] }));

        await FetchInstance.get("projects/", {
            params: { page: 2, page_size: 10, search: "alpha" },
        });

        const [url] = mock.mock.calls[0] as [URL];
        const parsed = new URL(String(url));
        expect(parsed.searchParams.get("page")).toBe("2");
        expect(parsed.searchParams.get("page_size")).toBe("10");
        expect(parsed.searchParams.get("search")).toBe("alpha");
    });

    test("skips undefined param values", async () => {
        const mock = stubFetch(makeResponse({ body: [] }));

        await FetchInstance.get("projects/", { params: { page: 1, search: undefined } });

        const [url] = mock.mock.calls[0] as [URL];
        expect(new URL(String(url)).searchParams.has("search")).toBe(false);
    });

    test("skips null param values", async () => {
        const mock = stubFetch(makeResponse({ body: [] }));

        await FetchInstance.get("projects/", { params: { page: 1, status: null } });

        const [url] = mock.mock.calls[0] as [URL];
        expect(new URL(String(url)).searchParams.has("status")).toBe(false);
    });

    test("skips empty-string param values", async () => {
        const mock = stubFetch(makeResponse({ body: [] }));

        await FetchInstance.get("projects/", { params: { page: 1, search: "" } });

        const [url] = mock.mock.calls[0] as [URL];
        expect(new URL(String(url)).searchParams.has("search")).toBe(false);
    });

    // ── Non-ok responses ─────────────────────────────────────────────────────

    test("throws with status and data when response is 404", async () => {
        stubFetch(makeResponse({ status: 404, body: { detail: "Not found." } }));

        await expect(FetchInstance.get("projects/99/")).rejects.toMatchObject({
            status: 404,
            data: { detail: "Not found." },
        });
    });

    test("throws with status and data when response is 400", async () => {
        stubFetch(
            makeResponse({ status: 400, body: { name: ["This field is required."] } })
        );

        await expect(FetchInstance.post("projects/", {})).rejects.toMatchObject({
            status: 400,
            data: { name: ["This field is required."] },
        });
    });

    test("throws with status 500", async () => {
        stubFetch(makeResponse({ status: 500, body: { detail: "Server error." } }));

        await expect(FetchInstance.get("projects/")).rejects.toMatchObject({
            status: 500,
        });
    });

    // ── Body parsing ─────────────────────────────────────────────────────────

    test("parses plain-text response body as a string", async () => {
        stubFetch(makeResponse({ body: "OK", contentType: "text/plain" }));

        const result = await FetchInstance.get("health/");

        expect(result.data).toBe("OK");
    });

    test("returns null for an empty response body", async () => {
        stubFetch(makeResponse({ body: null }));

        const result = await FetchInstance.delete("projects/1/");

        expect(result.data).toBeNull();
    });

    // ── Timeout / AbortError ─────────────────────────────────────────────────

    test("throws with ECONNABORTED code when the request is aborted", async () => {
        // DOMException.name is read-only — pass "AbortError" as the second
        // constructor argument, which is the spec-correct way to set it.
        const abortError = new DOMException("The operation was aborted.", "AbortError");
        globalThis.fetch = vi.fn().mockRejectedValue(abortError) as unknown as typeof fetch;

        await expect(FetchInstance.get("projects/", { timeout: 1 })).rejects.toMatchObject({
            code: "ECONNABORTED",
        });
    });

    // ── Session-expired path ─────────────────────────────────────────────────

    test("fires session-expired handler and throws SESSION_EXPIRED when refresh fails", async () => {
        const sessionHandler = vi.fn();
        registerSessionExpiredHandler(sessionHandler);

        // Call 1: original request → 401
        // Call 2: refresh endpoint → 401 (refresh itself fails)
        stubFetch(
            makeResponse({ status: 401, body: { detail: "Unauthorized" } }),
            makeResponse({ status: 401, body: {} })
        );

        await expect(FetchInstance.get("projects/")).rejects.toMatchObject({
            code: "SESSION_EXPIRED",
            status: 401,
        });

        expect((tokenStore as unknown as { clear: ReturnType<typeof vi.fn> }).clear)
            .toHaveBeenCalled();
        expect(sessionHandler).toHaveBeenCalled();
    });

    // ── registerSessionExpiredHandler (line 10) ──────────────────────────────

    test("registerSessionExpiredHandler stores and invokes the handler", async () => {
        const handler = vi.fn();
        registerSessionExpiredHandler(handler);

        stubFetch(
            makeResponse({ status: 401 }),
            makeResponse({ status: 401 })
        );

        await expect(FetchInstance.get("projects/")).rejects.toMatchObject({
            code: "SESSION_EXPIRED",
        });

        expect(handler).toHaveBeenCalled();
    });
});