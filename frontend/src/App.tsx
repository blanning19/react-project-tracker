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
 * REMARK: /login stays outside the Navbar shell so the login page remains
 * simple and can never get caught in a protected-layout redirect loop.
 *
 * REMARK: /about is public, but now lives inside the Navbar layout so users
 * keep the application shell when navigating there.
 *
 * REMARK: Only the project pages are protected by RequireAuth.
 */
function App() {
    return (
        <div className="App">
            <Routes>
                {/* REMARK: Public standalone route with no Navbar */}
                <Route path="/login" element={<Login />} />

                {/* REMARK: Shared application shell with Navbar */}
                <Route element={<Navbar />}>
                    {/* REMARK: Public route that still keeps the Navbar visible */}
                    <Route path="/about" element={<About />} />

                    {/* REMARK: Protected routes only */}
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