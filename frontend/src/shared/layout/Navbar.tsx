/**
 * @file Application shell layout component with a responsive sidebar.
 *
 * Renders as a React Router layout route. `App.tsx` wraps all shared routes
 * with `<Route element={<Navbar />}>` so the sidebar persists across page
 * changes without remounting.
 *
 * @module shared/layout/Navbar
 */

import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button, Offcanvas } from "react-bootstrap";
import { Home, Info, Plus, Menu, PanelLeftClose, PanelLeftOpen, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { tokenStore } from "../auth/tokens";
import ThemeToggle from "../theme/ThemeToggle";

// ---------------------------------------------------------------------------
// Layout component — replaces the content-prop pattern with React Router's
// Outlet. Routes are no longer passed into Navbar as a prop; instead Navbar
// renders <Outlet /> in the main content area and App.tsx owns the route tree.
//
// Before:
//   <Navbar content={<Routes>...</Routes>} />  ← routes as prop (inverted)
//
// After:
//   <Route element={<Navbar />}>              ← Navbar is a layout route
//     <Route path="/" element={<Home />} />
//     ...
//   </Route>
// ---------------------------------------------------------------------------

/**
 * A single navigation link entry in the sidebar.
 */
interface NavItem {
    /** React Router path string. */
    to: string;
    /** Visible label shown next to the icon when the sidebar is expanded. */
    label: string;
    /**
     * When `true`, the active check requires an exact path match.
     * Pass `true` for the Home link to prevent it matching every route.
     */
    end?: boolean;
    /** Lucide icon element rendered inside the link. */
    icon: React.ReactNode;
}

const iconProps = { size: 18, strokeWidth: 2.2 };

/** Navigation items shown in both the desktop sidebar and mobile drawer. */
const navItems: NavItem[] = [
    { to: "/", label: "Home", end: true, icon: <Home {...iconProps} /> },
    { to: "/about", label: "About", icon: <Info {...iconProps} /> },
    { to: "/create", label: "Create", icon: <Plus {...iconProps} /> },
];

/** Pixel width of the sidebar when fully expanded. */
const SIDEBAR_WIDTH_EXPANDED = 260;
/** Pixel width of the sidebar when collapsed to icon-only mode. */
const SIDEBAR_WIDTH_COLLAPSED = 76;
/** `localStorage` key used to persist the collapsed state across sessions. */
const SIDEBAR_STORAGE_KEY = "pt.sidebar.collapsed";

/**
 * Application shell layout component.
 *
 * Renders a sticky desktop sidebar and a mobile `Offcanvas` drawer. The active
 * child route is rendered in the `<main>` area via React Router's `<Outlet />`.
 *
 * ### Sidebar behaviour
 * - Expand/collapse is toggled with the chevron button and persisted to
 *   `localStorage` so the preference survives page reloads.
 * - In collapsed mode, icon-only links use the `title` attribute for
 *   accessibility tooltip text.
 * - Auth state is read from `tokenStore` directly (not `useAuth`) so the
 *   login/logout button reflects the current token without depending on a
 *   re-render from context.
 *
 * ### Logout
 * Delegates entirely to `useAuth().logout()` which handles the backend
 * blacklist call, clears local token state, and redirects to `/login`.
 * Navbar must not call `tokenStore.clear()` directly.
 *
 * @returns The full application shell with sidebar and page content area.
 */
export default function Navbar() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const isLoggedIn = Boolean(tokenStore.getAccess());
    const [mobileOpen, setMobileOpen] = useState(false);

    const [collapsed, setCollapsed] = useState(() => {
        return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
    });

    const currentWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

    useEffect(() => {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
    }, [collapsed]);

    const handleLogout = async () => {
        setMobileOpen(false);
        await logout();
    };

    const navLinkClass = useMemo(() => {
        return ({ isActive }: { isActive: boolean }) =>
            `nav-link d-flex align-items-center gap-2 rounded px-3 py-2${isActive ? " active fw-semibold shadow-sm" : ""}`;
    }, []);

    const renderNav = (compact = false) => (
        <ul className="nav nav-pills flex-column gap-2 mb-0">
            {navItems.map((item) => (
                <li className="nav-item" key={item.to}>
                    <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `${navLinkClass({ isActive })}${compact ? " justify-content-center px-2" : ""}`
                        }
                        title={compact ? item.label : undefined}
                    >
                        <span style={{ width: 18, minWidth: 18, textAlign: "center", display: "inline-flex", justifyContent: "center" }}>
                            {item.icon}
                        </span>
                        {!compact && <span>{item.label}</span>}
                    </NavLink>
                </li>
            ))}
        </ul>
    );

    const renderAuthButton = (compact = false) =>
        isLoggedIn ? (
            <Button
                variant="outline-danger"
                size="sm"
                className="w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleLogout}
                title={compact ? "Logout" : undefined}
            >
                <LogOut size={16} />
                {!compact && <span>Logout</span>}
            </Button>
        ) : (
            <Button
                variant="outline-primary"
                size="sm"
                className="w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => { setMobileOpen(false); navigate("/login"); }}
                title={compact ? "Login" : undefined}
            >
                <LogIn size={16} />
                {!compact && <span>Login</span>}
            </Button>
        );

    return (
        <div className="min-vh-100 bg-body text-body">
            {/* Mobile top bar */}
            <div className="d-md-none border-bottom bg-body-tertiary sticky-top">
                <div className="d-flex align-items-center justify-content-between px-3 py-2">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation"
                    >
                        <Menu size={18} />
                    </Button>
                    <div className="fw-semibold text-danger">PROJECT TRACKER</div>
                    <ThemeToggle />
                </div>
            </div>

            <div className="d-flex">
                {/* Desktop sidebar */}
                <aside
                    className="d-none d-md-flex border-end bg-body-tertiary flex-column"
                        style={{
                            width: currentWidth,
                            minWidth: currentWidth, // REMARK: Keep the sidebar from compressing narrower than its intended width
                            flexShrink: 0,          // REMARK: Prevent wide page content (like About) from shrinking the sidebar
                            minHeight: "100vh",
                            position: "sticky",
                            top: 0,
                            transition: "width 0.25s ease",
                            overflow: "hidden",
                        }}
                >
                    <div className={`p-3 border-bottom d-flex align-items-center ${collapsed ? "justify-content-center" : "justify-content-between"}`}>
                        {!collapsed && (
                            <NavLink className="navbar-brand fw-semibold m-0 text-decoration-none" to="/">
                                Project Tracker
                            </NavLink>
                        )}
                        <div className="d-flex align-items-center gap-2">
                            {!collapsed && <ThemeToggle />}
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setCollapsed((prev) => !prev)}
                                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                            >
                                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                            </Button>
                        </div>
                    </div>

                    {collapsed && (
                        <div className="px-2 pt-2 d-flex justify-content-center">
                            <ThemeToggle />
                        </div>
                    )}

                    <nav className="p-2 flex-grow-1">{renderNav(collapsed)}</nav>

                    <div className="p-3 border-top">{renderAuthButton(collapsed)}</div>
                </aside>

                {/* Page content — rendered by the active child route */}
                <main className="flex-grow-1 p-3" style={{ minWidth: 0, transition: "all 0.25s ease" }}>
                    <Outlet />
                </main>
            </div>

            {/* Mobile drawer */}
            <Offcanvas
                show={mobileOpen}
                onHide={() => setMobileOpen(false)}
                placement="start"
                className="d-md-none"
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Project Tracker</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column p-2">
                    <div className="px-2 pb-2"><ThemeToggle /></div>
                    <nav className="flex-grow-1">{renderNav(false)}</nav>
                    <div className="p-2 border-top">{renderAuthButton(false)}</div>
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );
}
