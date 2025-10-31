import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';

const Navbar = () => {
    const navigate = useNavigate();
    const user = authService.getUser();

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/login');
        }
    };

    return (
        <nav className="admin-navbar">
            <div className="nav-container">
                <div className="nav-brand">
                    <h2>🍁 Date & Maple Café</h2>
                    <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: '1rem' }}>
                        Admin Dashboard
                    </span>
                </div>

                <ul className="nav-menu">
                    <li>
                        <Link to="/dashboard" className="nav-link">
                            <i className="fas fa-tachometer-alt"></i> Dashboard
                        </Link>
                    </li>
                    <li>
                        <Link to="/staff" className="nav-link">
                            <i className="fas fa-users"></i> Staff
                        </Link>
                    </li>
                    <li>
                        <div className="user-info">
                            <i className="fas fa-user-circle"></i>
                            <span>Welcome, {user?.first_name || user?.username}</span>
                            <button
                                onClick={handleLogout}
                                className="btn secondary"
                                style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
                            >
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;