import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Root element #root not found.");

ReactDOM.createRoot(rootElement).render(
    <Router>
        <React.StrictMode>
            <App />
        </React.StrictMode>
    </Router>
);
