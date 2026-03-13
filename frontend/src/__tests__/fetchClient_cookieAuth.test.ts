import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../shared/auth/tokens", () => ({
    tokenStore: {
        getAccess:  vi.fn(() => "test-access-token"),
        getRefresh: vi.fn(() => null),
        setAccess:  vi.fn(),
        setRefresh: vi.fn(),
        clear:      vi.fn(),
    },
}));

// This is the key difference from fetchClient_extended.test.ts —
// isCookieAuth is true so the refresh branch at lines 29-39 executes.
vi.mock("../shared/auth/mode", () => ({
    isCookieAuth: true,
}));

import { tokenStore } from "../shared/auth/tokens";
import FetchInstance, { registerSessionExpiredHandler } from "../shared/http/fetchClient";

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

describe("fetchClient — cookie-auth refresh branch (lines 29-39)", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        registerSessionExpiredHandler(() => {});
    });

    test("cookie-auth: refresh succeeds, retries original request with new token (line 38-39)", async () => {
        // Call 1: original request → 401
        // Call 2: cookie refresh endpoint → 200 with new access token
        // Call 3: retried original request → 200
        stubFetch(
            makeResponse({ status: 401 }),
            makeResponse({ status: 200, body: { access: "NEW_COOKIE_ACCESS" } }),
            makeResponse({ status: 200, body: { id: 1 } })
        );

        const result = await FetchInstance.get("projects/");

        expect(result.data).toEqual({ id: 1 });
        expect(
            (tokenStore as unknown as { setAccess: ReturnType<typeof vi.fn> }).setAccess
        ).toHaveBeenCalledWith("NEW_COOKIE_ACCESS");
    });

    test("cookie-auth: refresh endpoint returns non-ok → session expired (line 35)", async () => {
        const sessionHandler = vi.fn();
        registerSessionExpiredHandler(sessionHandler);

        // Call 1: original request → 401
        // Call 2: cookie refresh endpoint → 401 (fails)
        stubFetch(
            makeResponse({ status: 401 }),
            makeResponse({ status: 401 })
        );

        await expect(FetchInstance.get("projects/")).rejects.toMatchObject({
            code: "SESSION_EXPIRED",
        });

        expect(sessionHandler).toHaveBeenCalled();
    });

    test("cookie-auth: refresh returns ok but no access field → session expired (line 37)", async () => {
        const sessionHandler = vi.fn();
        registerSessionExpiredHandler(sessionHandler);

        // Call 1: original request → 401
        // Call 2: cookie refresh → 200 but body has no access key
        stubFetch(
            makeResponse({ status: 401 }),
            makeResponse({ status: 200, body: { detail: "no token here" } })
        );

        await expect(FetchInstance.get("projects/")).rejects.toMatchObject({
            code: "SESSION_EXPIRED",
        });

        expect(sessionHandler).toHaveBeenCalled();
    });
});