/**
 * @file Application entry point.
 *
 * Bootstraps the React tree with all required providers:
 * - `QueryClientProvider` — React Query cache with default stale/retry settings
 * - `BrowserRouter` — React Router HTML5 history
 * - `AuthProvider` — JWT auth state and token management
 *
 * @module main
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import AuthProvider from "./shared/auth/AuthProvider";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

/**
 * Shared React Query client.
 *
 * Default options applied to every query:
 * - `staleTime: 30_000` — cached data is considered fresh for 30 seconds,
 *   preventing unnecessary background refetches on quick navigation.
 * - `retry: 1` — failed queries are retried once before surfacing an error.
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
        },
    },
});

const container = document.getElementById("root");

if (!container) {
    throw new Error("Root element #root not found. Check your index.html.");
}

createRoot(container).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>

            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </QueryClientProvider>
    </StrictMode>
);
