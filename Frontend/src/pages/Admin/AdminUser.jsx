// AdminUserPanel.jsx
import React, { useState } from 'react';
import '../../styles/Admin/AdminUserPanel.css';
import AdminSidebar from '../../components/AdminSidebar';


const AdminUserPanel = () => {
  // Sample initial user data
  const initialUsers = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'User', status: 'Active', lastLogin: '2025-03-07' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Premium', status: 'Active', lastLogin: '2025-03-08' },
    { id: 3, name: 'Robert Johnson', email: 'robert.j@example.com', role: 'User', status: 'Inactive', lastLogin: '2025-02-20' },
    { id: 4, name: 'Emily Wilson', email: 'emily.w@example.com', role: 'Admin', status: 'Active', lastLogin: '2025-03-08' },
    { id: 5, name: 'Michael Brown', email: 'michael.b@example.com', role: 'User', status: 'Suspended', lastLogin: '2025-01-15' },
  ];

  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Handle user removal
  const removeUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
    setConfirmDelete(null);
  };

  // Request confirmation before removing
  const confirmRemoval = (userId) => {
    setConfirmDelete(userId);
  };

  // Cancel removal confirmation
  const cancelRemoval = () => {
    setConfirmDelete(null);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get appropriate CSS classes for role and status
  const getRoleClass = (role) => {
    switch(role) {
      case 'Admin': return 'admin-badge admin-badge-purple';
      case 'Premium': return 'admin-badge admin-badge-green';
      default: return 'admin-badge admin-badge-blue';
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Active': return 'admin-badge admin-badge-green';
      case 'Inactive': return 'admin-badge admin-badge-gray';
      default: return 'admin-badge admin-badge-red';
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
    <div className="admin-container">
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h1 className="admin-panel-title">User Management</h1>
          <p className="admin-panel-subtitle">Manage user accounts and permissions</p>
        </div>

        {/* Search and filters */}
        <div className="admin-search-section">
          <div className="admin-search-container">
            <div className="admin-search-input-wrapper">
              <input
                type="text"
                placeholder="Search users..."
                className="admin-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="admin-search-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* User table */}
        <div className="admin-table-container">
          <table className="admin-user-table">
            <thead className="admin-table-head">
              <tr>
                <th className="admin-table-header">Name</th>
                <th className="admin-table-header">Email</th>
                <th className="admin-table-header">Role</th>
                <th className="admin-table-header">Status</th>
                <th className="admin-table-header">Last Login</th>
                <th className="admin-table-header admin-actions-column">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="admin-user-row">
                    <td className="admin-table-cell">
                      <div className="admin-user-info">
                        <div className="admin-user-avatar">
                          <span>{user.name.charAt(0)}</span>
                        </div>
                        <div className="admin-user-name">
                          <div>{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="admin-table-cell">
                      <div className="admin-user-email">{user.email}</div>
                    </td>
                    <td className="admin-table-cell">
                      <span className={getRoleClass(user.role)}>
                        {user.role}
                      </span>
                    </td>
                    <td className="admin-table-cell">
                      <span className={getStatusClass(user.status)}>
                        {user.status}
                      </span>
                    </td>
                    <td className="admin-table-cell admin-login-date">
                      {user.lastLogin}
                    </td>
                    <td className="admin-table-cell admin-actions-cell">
                      {confirmDelete === user.id ? (
                        <div className="admin-action-buttons">
                          <button 
                            onClick={() => removeUser(user.id)} 
                            className="admin-btn-text admin-btn-confirm"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={cancelRemoval}
                            className="admin-btn-text admin-btn-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="admin-action-buttons">
                          <button className="admin-btn-text admin-btn-edit">Edit</button>
                          <button 
                            onClick={() => confirmRemoval(user.id)} 
                            className="admin-btn-text admin-btn-remove"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="admin-empty-results">
                    No users found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="admin-pagination-container">
          <div className="admin-pagination-info">
            Showing <span className="admin-pagination-highlight">{filteredUsers.length}</span> of <span className="admin-pagination-highlight">{users.length}</span> users
          </div>
          <div className="admin-pagination-controls">
            <button className="admin-pagination-btn">Previous</button>
            <button className="admin-pagination-btn admin-pagination-btn-active">1</button>
            <button className="admin-pagination-btn">Next</button>
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default AdminUserPanel;