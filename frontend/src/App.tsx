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
 * Public routes are intentionally kept outside the protected application shell
 * so login can never be caught in an auth-redirect loop.
 *
 * Structure:
 *   /login            — public
 *   /about            — public
 *   RequireAuth       — protected guard
 *   └── Navbar        — protected app shell
 *       ├── /         — Home
 *       ├── /create   — Create project
 *       └── /edit/:id — Edit project
 */
function App() {
    return (
        <div className="App">
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/about" element={<About />} />

                {/* Protected application shell */}
                <Route element={<RequireAuth />}>
                    <Route element={<Navbar />}>
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