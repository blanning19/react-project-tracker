// src/__tests__/fetchClient.authHeader.test.jsx

import { describe, test, expect, beforeEach, vi } from 'vitest';
import FetchInstance from '../components/fetchClient';

function makeResponse({ status = 200, json = {}, headers = { 'content-type': 'application/json' } } = {}) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get: (k) => headers[k.toLowerCase()] || headers[k] || '', entries: () => Object.entries(headers) },
        text: async () => JSON.stringify(json),
        json: async () => json,
    };
}

describe('fetchClient - auth header', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    test('includes Authorization header when access token exists', async () => {
        localStorage.setItem('access', 'ACCESS_TOKEN');

        const fetchMock = vi.fn().mockResolvedValue(makeResponse({ status: 200, json: { ok: true } }));
        globalThis.fetch = fetchMock;

        await FetchInstance.get('me/');

        const [, options] = fetchMock.mock.calls[0];
        expect(options.headers.Authorization).toBe('Bearer ACCESS_TOKEN');
    });

    test('does not include Authorization header when no token', async () => {
        const fetchMock = vi.fn().mockResolvedValue(makeResponse({ status: 200, json: { ok: true } }));
        globalThis.fetch = fetchMock;

        await FetchInstance.get('me/');

        const [, options] = fetchMock.mock.calls[0];
        expect(options.headers.Authorization).toBeUndefined();
    });
});
