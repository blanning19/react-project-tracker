import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import FetchInstance from '../shared/http/fetchClient';
import { tokenStore } from '../auth/tokens';

/**
 * Force these tests into bearer-token mode.
 *
 * The refresh logic has two branches:
 * 1. cookie auth
 * 2. token auth
 *
 * These tests are specifically verifying the token refresh flow that uses
 * access + refresh tokens, so we lock isCookieAuth to false.
 */
vi.mock('../auth/mode', () => ({
    isCookieAuth: false,
}));

/**
 * Mock the token storage module used by fetchClient.
 *
 * This is more accurate than writing directly to localStorage because the
 * fetch client reads and writes tokens through tokenStore.
 */
vi.mock('../auth/tokens', () => ({
    tokenStore: {
        getAccess: vi.fn(),
        getRefresh: vi.fn(),
        setAccess: vi.fn(),
        setRefresh: vi.fn(),
        clear: vi.fn(),
    },
}));

/**
 * Creates a lightweight Response-like object for fetch mocks.
 *
 * The fetch client reads:
 * - ok
 * - status
 * - headers.get()
 * - headers.entries()
 * - text()
 * - json()
 *
 * This helper only implements the pieces required by the client.
 */
function makeResponse({
    status,
    body,
    contentType = 'application/json',
}) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: (key) => (key.toLowerCase() === 'content-type' ? contentType : ''),
            entries: () => [['content-type', contentType]],
        },
        text: async () => {
            if (body == null) return '';
            return typeof body === 'string' ? body : JSON.stringify(body);
        },
        json: async () => body,
    };
}

/**
 * Returns the URL and options used in a specific fetch call.
 *
 * Converting the URL argument to String makes the assertion stable whether
 * fetch was called with a string or a URL object.
 */
function getFetchCall(fetchMock, callIndex) {
    const [url, options] = fetchMock.mock.calls[callIndex];

    return {
        url: String(url),
        options,
    };
}

describe('fetchClient - refresh flow', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    test('on 401 token_not_valid, refreshes the access token and retries the original request once', async () => {
        /**
         * Simulate the initial state:
         * - the first protected request uses an expired access token
         * - a refresh token is available for the refresh request
         */
        tokenStore.getAccess
            .mockReturnValueOnce('EXPIRED_ACCESS')
            .mockReturnValueOnce('NEW_ACCESS');

        tokenStore.getRefresh.mockReturnValue('REFRESH_TOKEN');

        /**
         * Mock the three expected network calls:
         *
         * Call 1:
         *   Original request fails with 401 token_not_valid
         *
         * Call 2:
         *   Refresh endpoint returns a new access token
         *
         * Call 3:
         *   Original request is retried and succeeds
         */
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                makeResponse({
                    status: 401,
                    body: {
                        code: 'token_not_valid',
                        messages: [{ message: 'Token is expired' }],
                    },
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    status: 200,
                    body: { access: 'NEW_ACCESS' },
                })
            )
            .mockResolvedValueOnce(
                makeResponse({
                    status: 200,
                    body: { ok: true },
                })
            );

        globalThis.fetch = fetchMock;

        const response = await FetchInstance.get('me/');

        /**
         * Final response should come from the successful retried request.
         */
        expect(response.data).toEqual({ ok: true });

        /**
         * The client should make exactly three requests:
         * 1. original protected request
         * 2. refresh request
         * 3. retried protected request
         */
        expect(fetchMock).toHaveBeenCalledTimes(3);

        /**
         * The refresh flow should save the new access token.
         */
        expect(tokenStore.setAccess).toHaveBeenCalledWith('NEW_ACCESS');

        /**
         * Verify the first request used the expired token.
         */
        const firstCall = getFetchCall(fetchMock, 0);
        expect(firstCall.url).toContain('/api/me/');
        expect(firstCall.options.method).toBe('GET');
        expect(firstCall.options.headers.Authorization).toBe('Bearer EXPIRED_ACCESS');

        /**
         * Verify the second request went to the refresh endpoint and sent the
         * refresh token in the request body.
         */
        const secondCall = getFetchCall(fetchMock, 1);
        expect(secondCall.url).toContain('/api/auth/refresh/');
        expect(secondCall.options.method).toBe('POST');
        expect(secondCall.options.headers['Content-Type']).toBe('application/json');
        expect(secondCall.options.headers.Accept).toBe('application/json');
        expect(secondCall.options.body).toBe(JSON.stringify({ refresh: 'REFRESH_TOKEN' }));

        /**
         * Verify the retried original request used the newly refreshed token.
         */
        const thirdCall = getFetchCall(fetchMock, 2);
        expect(thirdCall.url).toContain('/api/me/');
        expect(thirdCall.options.method).toBe('GET');
        expect(thirdCall.options.headers.Authorization).toBe('Bearer NEW_ACCESS');
    });
});