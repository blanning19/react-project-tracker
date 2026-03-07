import "./App.css";
import { Route, Routes } from "react-router-dom";
import Navbar from "./shared/layout/Navbar";
import RequireAuth from "./features/auth/RequireAuth";
import About from "./features/about/About";
import Login from "./features/auth/Login";
import Home from "./features/home/Home";
import Create from "./features/projects/create/Create";
import Edit from "./features/projects/edit/Edit";

/**
 * Route tree using React Router layout routes.
 *
 * Layout route pattern:
 * - Navbar renders <Outlet /> in the main content area.
 * - RequireAuth renders <Outlet /> when authenticated, or redirects to /login.
 *
 * Structure:
 *   Navbar (layout — sidebar + chrome)
 *   ├── /login         — public
 *   ├── /about         — public
 *   └── RequireAuth (layout — auth guard)
 *       ├── /          — Home (includes inline DeleteModal)
 *       ├── /create    — Create project
 *       └── /edit/:id  — Edit project
 *
 * Note: /delete/:id has been removed. Deletion is now handled by DeleteModal
 * inline in HomeView, which avoids a full page navigation for a single
 * confirmation step.
 */
function App() {
    return (
        <div className="App">
            <Routes>
                <Route element={<Navbar />}>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/about" element={<About />} />

                    {/* Protected routes */}
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
