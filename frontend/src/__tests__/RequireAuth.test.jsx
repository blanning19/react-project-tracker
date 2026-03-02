// src/__tests__/RequireAuth.test.jsx

import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import RequireAuth from '../components/RequireAuth';

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

describe('RequireAuth', () => {
    beforeEach(() => localStorage.clear());

    test('redirects to /login when no access token', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <>
                                <div>Login Page</div>
                                <LocationSpy />
                            </>
                        }
                    />
                    <Route
                        path="/"
                        element={
                            <>
                                <RequireAuth>
                                    <div>Home Page</div>
                                </RequireAuth>
                                <LocationSpy />
                            </>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.getByTestId('location').textContent).toBe('/login');
    });

    test('renders children when access token exists and is not expired', () => {
        localStorage.setItem('access', makeJwt({ expSecondsFromNow: 3600 }));

        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <>
                                <div>Login Page</div>
                                <LocationSpy />
                            </>
                        }
                    />
                    <Route
                        path="/"
                        element={
                            <>
                                <RequireAuth>
                                    <div>Home Page</div>
                                </RequireAuth>
                                <LocationSpy />
                            </>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Home Page')).toBeInTheDocument();
        expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
        expect(screen.getByTestId('location').textContent).toBe('/');
    });

    test('redirects to /login when token is expired', () => {
        localStorage.setItem('access', makeJwt({ expSecondsFromNow: -10 }));

        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <>
                                <div>Login Page</div>
                                <LocationSpy />
                            </>
                        }
                    />
                    <Route
                        path="/"
                        element={
                            <>
                                <RequireAuth>
                                    <div>Home Page</div>
                                </RequireAuth>
                                <LocationSpy />
                            </>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.getByTestId('location').textContent).toBe('/login');
    });
});
