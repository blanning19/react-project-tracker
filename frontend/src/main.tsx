import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import { registerSessionExpiredHandler } from "./shared/http/fetchClient";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

registerSessionExpiredHandler(() => {
    window.location.replace("/login");
});

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
                <App />
            </BrowserRouter>
            {/* Position devtools to the left so it doesn't overlap UI elements
                in the bottom-right corner (e.g. pagination buttons). */}
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </QueryClientProvider>
    </StrictMode>
);
