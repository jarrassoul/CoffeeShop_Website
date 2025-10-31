import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Staff from './pages/Staff';
import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';
import authService from './services/auth';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    {/* Admin Login Route */}
                    <Route path="/login" element={<Login />} />

                    {/* Staff Login Route */}
                    <Route path="/staff-login" element={<StaffLogin />} />

                    {/* Admin Protected Routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Navbar />
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/staff" element={
                        <ProtectedRoute>
                            <Navbar />
                            <Staff />
                        </ProtectedRoute>
                    } />

                    {/* Staff Protected Routes */}
                    <Route path="/staff/dashboard" element={<StaffDashboard />} />
                    <Route path="/staff/orders" element={<StaffDashboard />} />

                    {/* Root redirect */}
                    <Route path="/" element={
                        authService.isAuthenticated() && !authService.isTokenExpired()
                            ? <Navigate to="/dashboard" replace />
                            : localStorage.getItem('staffToken')
                            ? <Navigate to="/staff/dashboard" replace />
                            : <Navigate to="/staff-login" replace />
                    } />

                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;