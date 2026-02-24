// src/__tests__/fetchClient.refresh.test.jsx

import { describe, test, expect, beforeEach, vi } from 'vitest';
import FetchInstance from '../components/fetchClient';

function makeResponse({ status, body, contentType = 'application/json' }) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: (k) => (k.toLowerCase() === 'content-type' ? contentType : ''),
            entries: () => [['content-type', contentType]],
        },
        text: async () => (body == null ? '' : typeof body === 'string' ? body : JSON.stringify(body)),
        json: async () => body,
    };
}

describe('fetchClient - refresh flow', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    test('on 401 token_not_valid, refreshes and retries once', async () => {
        localStorage.setItem('access', 'EXPIRED_ACCESS');
        localStorage.setItem('refresh', 'REFRESH_TOKEN');

        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                makeResponse({
                    status: 401,
                    body: { code: 'token_not_valid', messages: [{ message: 'Token is expired' }] },
                })
            )
            .mockResolvedValueOnce(makeResponse({ status: 200, body: { access: 'NEW_ACCESS' } }))
            .mockResolvedValueOnce(makeResponse({ status: 200, body: { ok: true } }));

        globalThis.fetch = fetchMock;

        const res = await FetchInstance.get('me/');
        expect(res.data).toEqual({ ok: true });
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(localStorage.getItem('access')).toBe('NEW_ACCESS');

        const thirdCallOptions = fetchMock.mock.calls[2][1];
        expect(thirdCallOptions.headers.Authorization).toBe('Bearer NEW_ACCESS');
    });
});
