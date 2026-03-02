import "./App.css";
import { Route, Routes } from "react-router-dom";
import Navbar from "./shared/layout/Navbar";
import About from "./features/about/About";
import Login from "./features/auth/Login";
import RequireAuth from "./features/auth/RequireAuth";
import Home from "./features/home/Home";
import Create from "./features/projects/create/Create";
import Edit from "./features/projects/edit/Edit";
import Delete from "./features/projects/delete/Delete";

function App() {
    const myWidth = 220;

    return (
        <div className="App">
            <Navbar
                drawerWidth={myWidth}
                content={
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
                        <Route path="/create" element={<RequireAuth><Create /></RequireAuth>} />
                        <Route path="/edit/:id" element={<RequireAuth><Edit /></RequireAuth>} />
                        <Route path="/delete/:id" element={<RequireAuth><Delete /></RequireAuth>} />
                        <Route path="/about" element={<About />} />
                    </Routes>
                }
            />
        </div>
    );
}

export default App;
