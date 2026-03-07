import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import RequireAuth from '../features/auth/RequireAuth';
import { tokenStore } from '../shared/auth/tokens';

vi.mock('../shared/auth/tokens', () => ({
    tokenStore: {
        getAccess: vi.fn(),
        getRefresh: vi.fn(),
        setAccess: vi.fn(),
        setRefresh: vi.fn(),
        clear: vi.fn(),
    },
}));

function LocationSpy() {
    const loc = useLocation();
    return <div data-testid="location">{loc.pathname}</div>;
}

function base64UrlEncode(obj) {
    const json = JSON.stringify(obj);
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function makeJwt({ expSecondsFromNow = 3600 } = {}) {
    const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
    const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
    const payload = base64UrlEncode({ exp });
    return `${header}.${payload}.testsig`;
}

/**
 * Helper: builds a MemoryRouter + Routes tree using RequireAuth as a layout route.
 *
 * RequireAuth is now a layout route that renders <Outlet /> rather than
 * accepting children directly.  Tests must nest the protected page as a child
 * <Route> of the <RequireAuth> route — matching the pattern used in App.tsx.
 */
function renderWithRouter({ initialPath = '/' } = {}) {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <LocationSpy />
            <Routes>
                <Route path="/login" element={<div>Login Page</div>} />
                {/* Layout route — RequireAuth renders <Outlet /> for protected children */}
                <Route element={<RequireAuth />}>
                    <Route path="/" element={<div>Home Page</div>} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

describe('RequireAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('redirects to /login when no access token', () => {
        tokenStore.getAccess.mockReturnValue(null);

        renderWithRouter();

        expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.getByTestId('location').textContent).toBe('/login');
        expect(tokenStore.clear).toHaveBeenCalledTimes(1);
    });

    test('renders children when access token exists and is not expired', () => {
        tokenStore.getAccess.mockReturnValue(makeJwt({ expSecondsFromNow: 3600 }));

        renderWithRouter();

        expect(screen.getByText('Home Page')).toBeInTheDocument();
        expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
        expect(screen.getByTestId('location').textContent).toBe('/');
        expect(tokenStore.clear).not.toHaveBeenCalled();
    });

    test('redirects to /login when token is expired', () => {
        tokenStore.getAccess.mockReturnValue(makeJwt({ expSecondsFromNow: -10 }));

        renderWithRouter();

        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.getByTestId('location').textContent).toBe('/login');
        expect(tokenStore.clear).toHaveBeenCalledTimes(1);
    });
});
