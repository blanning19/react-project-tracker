/**
 * @file Root application component and React Router route tree.
 *
 * Defines the complete route hierarchy using React Router layout routes so
 * the `Navbar` shell is shared without prop-drilling the route list.
 *
 * ### Route structure
 * ```
 * /login           — public, no Navbar
 * /about           — public, inside Navbar shell
 * /                — protected, inside Navbar + RequireAuth
 * /create          — protected, inside Navbar + RequireAuth
 * /edit/:id        — protected, inside Navbar + RequireAuth
 * ```
 *
 * @module App
 */

import "./App.css";
import { Route, Routes } from "react-router-dom";

import About from "./features/about/About";
import Login from "./features/auth/Login";
import RequireAuth from "./features/auth/RequireAuth";
import DashboardPage from "./features/dashboard/DashboardPage";
import Home from "./features/home/Home";
import Create from "./features/projects/create/Create";
import Edit from "./features/projects/edit/Edit";
import Navbar from "./shared/layout/Navbar";

/**
 * Root component that owns the React Router route tree.
 *
 * `/login` is deliberately kept outside the `Navbar` layout route so the
 * login page remains standalone and cannot get caught in a protected-layout
 * redirect loop.
 *
 * `/about` is public but lives inside the `Navbar` shell so users retain the
 * application navigation when browsing there.
 */
function App() {
    return (
        <div className="App">
            <Routes>
                {/* Public standalone route — no Navbar */}
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                {/* Shared application shell with Navbar */}
                <Route element={<Navbar />}>
                    {/* Public route that still shows the Navbar */}
                    <Route path="/about" element={<About />} />

                    {/* All project routes are gated by RequireAuth */}
                    <Route element={<RequireAuth />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/create" element={<Create />} />
                        <Route path="/edit/:id" element={<Edit />} />
                    </Route>
                </Route>
            </Routes>
        </div>
    );
}

export default App;
