import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { isCookieAuth } from "../../auth/mode";
import { tokenStore } from "../../auth/tokens";
import FetchInstance from "../http/fetchClient";
import ThemeToggle from "../theme/ThemeToggle";

interface NavbarProps {
    drawerWidth?: number;
    content: ReactNode;
}

export default function Navbar({ drawerWidth = 260, content }: NavbarProps) {
    const navigate = useNavigate();
    const isLoggedIn = Boolean(tokenStore.getAccess());

    const handleLogout = async () => {
        tokenStore.clear();

        if (isCookieAuth) {
            try {
                await FetchInstance.post("auth/logout/", {});
            } catch {
                // ignore
            }
        }

        navigate("/login");
    };

    return (
        <div className="min-vh-100 bg-body text-body">
            <div className="d-flex">
                <aside className="border-end bg-body-tertiary d-flex flex-column" style={{ width: drawerWidth + 40, minHeight: "100vh", position: "sticky", top: 0 }}>
                    <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                        <NavLink className="navbar-brand fw-semibold m-0 text-decoration-none" to="/">Project Tracker</NavLink>
                        <ThemeToggle />
                    </div>

                    <nav className="p-2 flex-grow-1">
                        <ul className="nav nav-pills flex-column gap-1">
                            <li className="nav-item"><NavLink to="/" end className={({ isActive }) => `nav-link d-flex align-items-center${isActive ? " active" : ""}`}>Home</NavLink></li>
                            <li className="nav-item"><NavLink to="/about" className={({ isActive }) => `nav-link d-flex align-items-center${isActive ? " active" : ""}`}>About</NavLink></li>
                            <li className="nav-item"><NavLink to="/create" className={({ isActive }) => `nav-link d-flex align-items-center${isActive ? " active" : ""}`}>Create</NavLink></li>
                        </ul>
                    </nav>

                    <div className="p-3 border-top">
                        {isLoggedIn ? <Button variant="outline-danger" size="sm" className="w-100" onClick={handleLogout}>Logout</Button> : <Button variant="outline-primary" size="sm" className="w-100" onClick={() => navigate("/login")}>Login</Button>}
                    </div>
                </aside>

                <main className="flex-grow-1 p-3">{content}</main>
            </div>
        </div>
    );
}
