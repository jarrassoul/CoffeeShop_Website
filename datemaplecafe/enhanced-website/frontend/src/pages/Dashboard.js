import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { staffAPI } from '../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalStaff: 0,
        byRole: {}
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            const response = await staffAPI.getAll();

            if (response.success) {
                const staff = response.staff;
                const byRole = {};

                staff.forEach(member => {
                    byRole[member.role] = (byRole[member.role] || 0) + 1;
                });

                setStats({
                    totalStaff: staff.length,
                    byRole
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            setError('Failed to load dashboard statistics');
        } finally {
            setIsLoading(false);
        }
    };

    const roleIcons = {
        'Manager': 'fas fa-user-tie',
        'Barista': 'fas fa-coffee',
        'Cashier': 'fas fa-cash-register',
        'Baker': 'fas fa-bread-slice',
        'Cleaner': 'fas fa-broom'
    };

    if (isLoading) {
        return (
            <div className="main-content">
                <div className="container">
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Loading dashboard...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content">
            <div className="container">
                <div className="fade-in">
                    <h1 className="page-title">Dashboard</h1>
                    <p style={{ textAlign: 'center', color: '#666', marginBottom: '3rem' }}>
                        Welcome to the Date & Maple Café Staff Management System
                    </p>

                    {error && (
                        <div className="card" style={{
                            backgroundColor: '#fee',
                            border: '1px solid #fcc',
                            color: '#c33'
                        }}>
                            <i className="fas fa-exclamation-triangle"></i> {error}
                        </div>
                    )}

                    {/* Statistics Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <i className="fas fa-users"></i>
                            <div className="stat-number">{stats.totalStaff}</div>
                            <div className="stat-label">Total Staff Members</div>
                        </div>

                        {Object.entries(stats.byRole).map(([role, count]) => (
                            <div key={role} className="stat-card">
                                <i className={roleIcons[role] || 'fas fa-user'}></i>
                                <div className="stat-number">{count}</div>
                                <div className="stat-label">{role}{count !== 1 ? 's' : ''}</div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Quick Actions</h2>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            <Link to="/staff" className="btn primary" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '1.5rem',
                                textDecoration: 'none'
                            }}>
                                <i className="fas fa-users" style={{ fontSize: '1.5rem' }}></i>
                                <div>
                                    <div style={{ fontWeight: '600' }}>Manage Staff</div>
                                    <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>
                                        View, add, edit staff members
                                    </div>
                                </div>
                            </Link>

                            <Link to="/staff?action=add" className="btn secondary" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '1.5rem',
                                textDecoration: 'none'
                            }}>
                                <i className="fas fa-user-plus" style={{ fontSize: '1.5rem' }}></i>
                                <div>
                                    <div style={{ fontWeight: '600' }}>Add New Staff</div>
                                    <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>
                                        Create new staff member
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">System Information</h2>
                        </div>

                        <div style={{ color: '#666' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                                <strong>Staff ID Format:</strong> Role prefix + 3-digit counter
                                <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                                    <li>Manager: MA001, MA002, etc.</li>
                                    <li>Barista: BA001, BA002, etc.</li>
                                    <li>Cashier: CA001, CA002, etc.</li>
                                    <li>Baker: BK001, BK002, etc.</li>
                                    <li>Cleaner: CL001, CL002, etc.</li>
                                </ul>
                            </div>

                            <div>
                                <i className="fas fa-shield-alt" style={{ marginRight: '0.5rem' }}></i>
                                <strong>Security:</strong> All staff data is encrypted and securely stored.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;