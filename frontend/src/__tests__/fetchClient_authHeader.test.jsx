import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

import { tokenStore } from '../shared/auth/tokens';
import FetchInstance from '../shared/http/fetchClient';

/**
 * Mock the auth mode module so these tests always run in bearer-token mode.
 *
 * This keeps the test focused on the Authorization header behavior and avoids
 * cookie-auth branching changing the request configuration unexpectedly.
 */
vi.mock('../auth/mode', () => ({
    isCookieAuth: false,
}));

/**
 * Mock the token store used by fetchClient.
 *
 * fetchClient does not read tokens directly from localStorage. Instead it asks
 * tokenStore for the current access token. Mocking tokenStore makes the test
 * more accurate and less dependent on storage implementation details.
 */
vi.mock('../shared/auth/tokens', () => ({
    tokenStore: {
        getAccess: vi.fn(),
        getRefresh: vi.fn(),
        setAccess: vi.fn(),
        setRefresh: vi.fn(),
        clear: vi.fn(),
    },
}));

/**
 * Creates a minimal Response-like object that behaves enough like the browser
 * Response for fetchClient to parse and return data successfully.
 */
function makeResponse({
    status = 200,
    json = {},
    headers = { 'content-type': 'application/json' },
} = {}) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: (key) => headers[key.toLowerCase()] || headers[key] || '',
            entries: () => Object.entries(headers),
        },
        text: async () => JSON.stringify(json),
        json: async () => json,
    };
}

/**
 * Replaces the global fetch function with a mock that returns a successful
 * response. The returned mock lets each test inspect the exact request that
 * fetchClient generated.
 */
function mockFetchResponse(responseOptions = {}) {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(responseOptions));
    globalThis.fetch = fetchMock;
    return fetchMock;
}

/**
 * Returns the URL and options passed into fetch for the first request.
 *
 * This helper also asserts that exactly one request was made, which produces
 * clearer failure messages if the request count changes unexpectedly.
 */
function getFetchCall(fetchMock) {
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];

    return { url, options };
}

describe('fetchClient - auth header', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    test('adds Authorization header when tokenStore returns an access token', async () => {
        tokenStore.getAccess.mockReturnValue('ACCESS_TOKEN');

        const fetchMock = mockFetchResponse({
            status: 200,
            json: { ok: true },
        });

        await FetchInstance.get('me/');

        const { url, options } = getFetchCall(fetchMock);

        /**
         * fetchClient builds the request URL with new URL(path, baseUrl), so the
         * first fetch argument is a URL object. Converting to string gives us the
         * final resolved URL for a stable assertion.
         */
        expect(String(url)).toContain('/api/me/');
        expect(options.method).toBe('GET');
        expect(options.headers.Authorization).toBe('Bearer ACCESS_TOKEN');
    });

    test('omits Authorization header when tokenStore does not return an access token', async () => {
        tokenStore.getAccess.mockReturnValue(null);

        const fetchMock = mockFetchResponse({
            status: 200,
            json: { ok: true },
        });

        await FetchInstance.get('me/');

        const { url, options } = getFetchCall(fetchMock);

        expect(String(url)).toContain('/api/me/');
        expect(options.method).toBe('GET');
        expect(options.headers.Authorization).toBeUndefined();
    });
});