import { useState } from 'react'
import '../css/AdminDashboard.css'

const AdminDashboard = () => {
    // State for active section
    const [activeSection, setActiveSection] = useState('overview')

    // Mock data for dashboard
    const dashboardStats = {
        totalUsers: 28,
        activeListings: 74,
        completedSales: 43,
        pendingReports: 4,
        totalRevenue: 12540.75,
        newUsersToday: 12
    }

    // Mock data for users
    const users = [
        {
            id: 1,
            name: 'Test Name',
            email: 'test.name@mavs.uta.edu',
            joinDate: '2025-01-15T10:30:00Z',
            status: 'active',
            listings: 3,
            sales: 5
        },
        {
            id: 2,
            name: 'Sarah Smith',
            email: 'sarah.smith@mavs.uta.edu',
            joinDate: '2025-01-20T14:45:00Z',
            status: 'active',
            listings: 5,
            sales: 2
        },
        {
            id: 3,
            name: 'Michael Johnson',
            email: 'michael.johnson@mavs.uta.edu',
            joinDate: '2025-01-18T09:15:00Z',
            status: 'inactive',
            listings: 0,
            sales: 3
        },
        {
            id: 4,
            name: 'Emily Wilson',
            email: 'emily.wilson@mavs.uta.edu',
            joinDate: '2025-01-25T16:20:00Z',
            status: 'active',
            listings: 2,
            sales: 1
        },
        {
            id: 5,
            name: 'David Lee',
            email: 'david.lee@mavs.uta.edu',
            joinDate: '2025-01-10T11:00:00Z',
            status: 'suspended',
            listings: 1,
            sales: 4
        }
    ]

    // Mock data for recent listings
    const recentListings = [
        {
            id: 101,
            name: 'iPhone 13 Pro',
            seller: 'Test Name',
            price: 650.00,
            category: 'Electronics',
            date: '2025-02-09T14:30:00Z',
            status: 'pending'
        },
        {
            id: 102,
            name: 'Calculus Textbook',
            seller: 'Sarah Smith',
            price: 45.00,
            category: 'Textbooks',
            date: '2025-02-08T10:15:00Z',
            status: 'approved'
        },
        {
            id: 103,
            name: 'Dorm Refrigerator',
            seller: 'Emily Wilson',
            price: 80.00,
            category: 'Furniture',
            date: '2025-02-07T16:45:00Z',
            status: 'approved'
        },
        {
            id: 104,
            name: 'UTA Parking Pass',
            seller: 'David Lee',
            price: 120.00,
            category: 'Other',
            date: '2025-02-06T09:30:00Z',
            status: 'rejected'
        }
    ]

    // Mock data for reports
    const reports = [
        {
            id: 201,
            type: 'Listing',
            itemId: 105,
            itemName: 'Fake Designer Watch',
            reportedBy: 'Emily Wilson',
            reason: 'Counterfeit item',
            date: '2025-02-08T13:20:00Z',
            status: 'pending'
        },
        {
            id: 202,
            type: 'User',
            itemId: 6,
            itemName: 'Robert Brown',
            reportedBy: 'Test Name',
            reason: 'Harassment in messages',
            date: '2025-02-07T15:10:00Z',
            status: 'pending'
        },
        {
            id: 203,
            type: 'Listing',
            itemId: 106,
            itemName: 'Prohibited Item',
            reportedBy: 'Sarah Smith',
            reason: 'Selling prohibited items',
            date: '2025-02-06T11:45:00Z',
            status: 'resolved'
        }
    ]

    // Function to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // Function to handle user status change
    const handleStatusChange = (userId, newStatus) => {
        console.log(`Changing user ${userId} status to ${newStatus}`)
    }

    // Function to handle approval/rejection of listings
    const handleListingAction = (listingId, action) => {
        console.log(`${action} listing ${listingId}`)
    }

    // Function to handle report resolution
    const handleReportAction = (reportId, action) => {
        console.log(`${action} report ${reportId}`)
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-sidebar">
                <div className="admin-title">
                    <h2>Admin Dashboard</h2>
                </div>
                <nav className="admin-nav">
                    <button
                        className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveSection('overview')}
                    >
                        <span className="nav-icon">📊</span>
                        Overview
                    </button>
                    <button
                        className={`nav-item ${activeSection === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveSection('users')}
                    >
                        <span className="nav-icon">👥</span>
                        User Management
                    </button>
                    <button
                        className={`nav-item ${activeSection === 'listings' ? 'active' : ''}`}
                        onClick={() => setActiveSection('listings')}
                    >
                        <span className="nav-icon">📦</span>
                        Listings
                    </button>
                    <button
                        className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveSection('reports')}
                    >
                        <span className="nav-icon">🚨</span>
                        Reports
                        {reports.filter(r => r.status === 'pending').length > 0 && (
                            <span className="badge">{reports.filter(r => r.status === 'pending').length}</span>
                        )}
                    </button>
                    <button
                        className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveSection('settings')}
                    >
                        <span className="nav-icon">⚙️</span>
                        Settings
                    </button>
                </nav>
            </div>

            <div className="admin-content">
                {/* Overview Section */}
                {activeSection === 'overview' && (
                    <div className="overview-section">
                        <h1>Dashboard Overview</h1>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">👥</div>
                                <div className="stat-info">
                                    <h3>Total Users</h3>
                                    <p className="stat-value">{dashboardStats.totalUsers}</p>
                                    <p className="stat-change positive">+{dashboardStats.newUsersToday} today</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📦</div>
                                <div className="stat-info">
                                    <h3>Active Listings</h3>
                                    <p className="stat-value">{dashboardStats.activeListings}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-info">
                                    <h3>Total Sales</h3>
                                    <p className="stat-value">{dashboardStats.completedSales}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">💵</div>
                                <div className="stat-info">
                                    <h3>Total Revenue</h3>
                                    <p className="stat-value">${dashboardStats.totalRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="recent-activity">
                            <h2>Recent Activity</h2>
                            <div className="activity-grid">
                                <div className="activity-card">
                                    <h3>Recent Listings</h3>
                                    <div className="activity-list">
                                        {recentListings.slice(0, 3).map(listing => (
                                            <div className="activity-item" key={listing.id}>
                                                <p className="activity-title">{listing.name}</p>
                                                <p className="activity-details">
                                                    <span>Seller: {listing.seller}</span>
                                                    <span>Price: ${listing.price.toFixed(2)}</span>
                                                    <span>Date: {formatDate(listing.date)}</span>
                                                </p>
                                                <span className={`status-badge ${listing.status}`}>
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                                            </div>
                                        ))}
                                        <button className="view-all-btn" onClick={() => setActiveSection('listings')}>
                                            View All Listings
                                        </button>
                                    </div>
                                </div>

                                <div className="activity-card">
                                    <h3>Pending Reports</h3>
                                    <div className="activity-list">
                                        {reports.filter(r => r.status === 'pending').slice(0, 3).map(report => (
                                            <div className="activity-item" key={report.id}>
                                                <p className="activity-title">{report.type}: {report.itemName}</p>
                                                <p className="activity-details">
                                                    <span>Reported by: {report.reportedBy}</span>
                                                    <span>Reason: {report.reason}</span>
                                                    <span>Date: {formatDate(report.date)}</span>
                                                </p>
                                                <div className="activity-actions">
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleReportAction(report.id, 'resolve')}
                                                    >
                                                        Resolve
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() => handleReportAction(report.id, 'dismiss')}
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="view-all-btn" onClick={() => setActiveSection('reports')}>
                                            View All Reports
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Section */}
                {activeSection === 'users' && (
                    <div className="users-section">
                        <h1>User Management</h1>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Join Date</th>
                                    <th>Status</th>
                                    <th>Listings</th>
                                    <th>Sales</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{formatDate(user.joinDate)}</td>
                                        <td>
                        <span className={`status-badge ${user.status}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                                        </td>
                                        <td>{user.listings}</td>
                                        <td>{user.sales}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <select
                                                    className="status-select"
                                                    value={user.status}
                                                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                    <option value="suspended">Suspended</option>
                                                </select>
                                                <button className="btn btn-sm btn-outline">View</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Listings Section */}
                {activeSection === 'listings' && (
                    <div className="listings-section">
                        <h1>Listings Management</h1>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Seller</th>
                                    <th>Price</th>
                                    <th>Category</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {recentListings.map(listing => (
                                    <tr key={listing.id}>
                                        <td>{listing.id}</td>
                                        <td>{listing.name}</td>
                                        <td>{listing.seller}</td>
                                        <td>${listing.price.toFixed(2)}</td>
                                        <td>{listing.category}</td>
                                        <td>{formatDate(listing.date)}</td>
                                        <td>
                        <span className={`status-badge ${listing.status}`}>
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {listing.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleListingAction(listing.id, 'approve')}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline"
                                                            onClick={() => handleListingAction(listing.id, 'reject')}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button className="btn btn-sm btn-outline">View</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Reports Section */}
                {activeSection === 'reports' && (
                    <div className="reports-section">
                        <h1>Reports Management</h1>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Item</th>
                                    <th>Reported By</th>
                                    <th>Reason</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reports.map(report => (
                                    <tr key={report.id}>
                                        <td>{report.id}</td>
                                        <td>{report.type}</td>
                                        <td>{report.itemName}</td>
                                        <td>{report.reportedBy}</td>
                                        <td>{report.reason}</td>
                                        <td>{formatDate(report.date)}</td>
                                        <td>
                        <span className={`status-badge ${report.status}`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {report.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleReportAction(report.id, 'resolve')}
                                                        >
                                                            Resolve
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline"
                                                            onClick={() => handleReportAction(report.id, 'dismiss')}
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </>
                                                )}
                                                <button className="btn btn-sm btn-outline">View</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Settings Section */}
                {activeSection === 'settings' && (
                    <div className="settings-section">
                        <h1>Platform Settings</h1>
                        <div className="settings-container">
                            <div className="settings-card">
                                <h3>General Settings</h3>
                                <form className="settings-form">
                                    <div className="form-group">
                                        <label htmlFor="siteName">Platform Name</label>
                                        <input
                                            type="text"
                                            id="siteName"
                                            className="form-control"
                                            defaultValue="UTA Market Place"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="contactEmail">Support Email</label>
                                        <input
                                            type="email"
                                            id="contactEmail"
                                            className="form-control"
                                            defaultValue="support@utamarketplace.edu"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="itemsPerPage">Items Per Page</label>
                                        <input
                                            type="number"
                                            id="itemsPerPage"
                                            className="form-control"
                                            defaultValue="20"
                                        />
                                    </div>
                                    <button type="button" className="btn btn-primary">Save Changes</button>
                                </form>
                            </div>

                            <div className="settings-card">
                                <h3>Commission Settings</h3>
                                <form className="settings-form">
                                    <div className="form-group">
                                        <label htmlFor="commissionRate">Commission Rate (%)</label>
                                        <input
                                            type="number"
                                            id="commissionRate"
                                            className="form-control"
                                            defaultValue="5"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="minCommission">Minimum Commission ($)</label>
                                        <input
                                            type="number"
                                            id="minCommission"
                                            className="form-control"
                                            defaultValue="0.50"
                                            min="0"
                                            step="0.1"
                                        />
                                    </div>
                                    <button type="button" className="btn btn-primary">Save Changes</button>
                                </form>
                            </div>

                            <div className="settings-card">
                                <h3>Security Settings</h3>
                                <form className="settings-form">
                                    <div className="form-group form-check">
                                        <input
                                            type="checkbox"
                                            id="requireEmailVerification"
                                            className="form-check-input"
                                            defaultChecked
                                        />
                                        <label htmlFor="requireEmailVerification" className="form-check-label">
                                            Require Email Verification
                                        </label>
                                    </div>
                                    <div className="form-group form-check">
                                        <input
                                            type="checkbox"
                                            id="requireAdminApproval"
                                            className="form-check-input"
                                            defaultChecked
                                        />
                                        <label htmlFor="requireAdminApproval" className="form-check-label">
                                            Require Admin Approval for Listings
                                        </label>
                                    </div>
                                    <div className="form-group form-check">
                                        <input
                                            type="checkbox"
                                            id="enableTwoFactor"
                                            className="form-check-input"
                                            defaultChecked
                                        />
                                        <label htmlFor="enableTwoFactor" className="form-check-label">
                                            Enable Two-Factor Authentication Option
                                        </label>
                                    </div>
                                    <button type="button" className="btn btn-primary">Save Changes</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminDashboard