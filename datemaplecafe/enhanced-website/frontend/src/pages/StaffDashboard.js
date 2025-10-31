import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffAuthAPI } from '../services/api';
import MenuManagement from '../components/MenuManagement';
import MenuViewer from '../components/MenuViewer';
import './Dashboard.css';

const StaffDashboard = () => {
    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('staffToken');
        const staffData = localStorage.getItem('staffUser');

        if (!token || !staffData) {
            navigate('/staff-login');
            return;
        }

        try {
            const parsedStaff = JSON.parse(staffData);
            setStaff(parsedStaff);
            setLoading(false);
        } catch (error) {
            console.error('Error parsing staff data:', error);
            navigate('/staff-login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffUser');
        navigate('/staff-login');
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <div>Loading...</div>
            </div>
        );
    }

    if (!staff) {
        return null;
    }

    const canEditMenu = staff.role === 'Manager';

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="header-content">
                    <h1>🍁 Date Maple Cafe - Staff Portal</h1>
                    <div className="user-info">
                        <span className="welcome-text">
                            Welcome back, {staff.firstName} {staff.lastName}
                        </span>
                        <span className="role-badge" style={{
                            backgroundColor: getRoleBadgeColor(staff.role),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.85em',
                            marginLeft: '10px',
                            fontWeight: 'bold'
                        }}>
                            {staff.role}
                        </span>
                        <span className="staff-id" style={{
                            color: '#666',
                            fontSize: '0.9em',
                            marginLeft: '10px'
                        }}>
                            ID: {staff.staffId}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="logout-button"
                            style={{
                                marginLeft: '15px',
                                padding: '8px 16px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                {staff.role === 'Manager' ? (
                    <div>
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '1px solid #dee2e6'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                                👨‍💼 Manager Dashboard
                            </h3>
                            <p style={{ margin: 0, color: '#6c757d' }}>
                                You have full access to manage the menu, view orders, and oversee operations.
                            </p>
                        </div>
                        <MenuManagement />
                    </div>
                ) : staff.role === 'Cashier' ? (
                    <div>
                        <div style={{
                            backgroundColor: '#e3f2fd',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '1px solid #bbdefb'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
                                💰 Cashier Dashboard
                            </h3>
                            <p style={{ margin: 0, color: '#1565c0' }}>
                                View menu items and process customer orders.
                            </p>
                        </div>
                        <MenuViewer viewMode="cashier" />
                    </div>
                ) : (
                    <div>
                        <div style={{
                            backgroundColor: '#fff3e0',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '1px solid #ffcc02'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>
                                👨‍🍳 {staff.role} Dashboard
                            </h3>
                            <p style={{ margin: 0, color: '#ef6c00' }}>
                                View menu items to understand preparation requirements.
                            </p>
                        </div>
                        <MenuViewer viewMode="staff" />
                    </div>
                )}
            </div>
        </div>
    );
};

const getRoleBadgeColor = (role) => {
    switch (role) {
        case 'Manager':
            return '#28a745'; // Green
        case 'Cashier':
            return '#007bff'; // Blue
        case 'Barista':
            return '#8B4513'; // Brown
        case 'Baker':
            return '#fd7e14'; // Orange
        case 'Cleaner':
            return '#6f42c1'; // Purple
        default:
            return '#6c757d'; // Gray
    }
};

export default StaffDashboard;