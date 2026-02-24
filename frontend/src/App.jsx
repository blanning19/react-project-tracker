import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import Create from './components/Create';
import Navbar from './components/NavBar';
import Edit from './components/Edit';
import Delete from './components/Delete';
import Login from './components/Login';
import RequireAuth from './components/RequireAuth';

function App() {
    const myWidth = 220;

    return (
        <div className="App">
            <Navbar
                drawerWidth={myWidth}
                content={
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route
                            path="/"
                            element={
                                <RequireAuth>
                                    <Home />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/create"
                            element={
                                <RequireAuth>
                                    <Create />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/edit/:id"
                            element={
                                <RequireAuth>
                                    <Edit />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/delete/:id"
                            element={
                                <RequireAuth>
                                    <Delete />
                                </RequireAuth>
                            }
                        />

                        {/* About can be public or protected—your call */}
                        <Route path="/about" element={<About />} />
                    </Routes>
                }
            />
        </div>
    );
}

export default App;
