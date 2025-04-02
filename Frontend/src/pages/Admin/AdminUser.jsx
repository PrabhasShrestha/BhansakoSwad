import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin/AdminUserPanel.css';
import AdminSidebar from '../../components/AdminSidebar';

const AdminUserPanel = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false)

  // Fetch users from API
  useEffect(() => {
    axios.get("http://localhost:3000/api/admin/allData") // Adjust API URL if needed
      .then(response => {
        console.log(response);
        if (response.data.success) {
          const fetchedUsers = response.data.users.map(user => {
            let roles = user.role.split(', ').map(role => role.trim());

            return {
              id: user.id,
              name: `${user.first_name} ${user.last_name}`,
              email: user.email,
              role: roles.join(', '),  
              status: user.status,
              contactNumber: user.phone_number || "N/A",
              activity_status: user.activity_status // Track active/deactivated state
            };
          });
          setUsers(fetchedUsers);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, []);

  // Toggle User Status (Deactivate/Reactivate)
  const toggleUserStatus = (userId) => {
    if (statusUpdating) return; // Prevent multiple clicks
    setStatusUpdating(true);
  
    axios.post(`http://localhost:3000/api/admin/UserStatus/${userId}`)
      .then(response => {
        if (response.data.success) {
          setUsers(users.map(user =>
            user.id === userId ? { ...user, activity_status: user.activity_status === "active" ? "deactivated" : "active" } : user
          ));
        } else {
          alert(response.data.message);
        }
      })
      .catch(error => {
        console.error("Error updating user status:", error);
        alert("Failed to update user status.");
      })
      .finally(() => setStatusUpdating(false));
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
    if (role.includes('Admin')) return 'admin-badge admin-badge-purple';
    if (role.includes('Chef')) return 'admin-badge admin-badge-orange';
    if (role.includes('Seller')) return 'admin-badge admin-badge-gray';
    return 'admin-badge admin-badge-blue';
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Admin': return 'admin-badge admin-badge-purple';
      case 'Chef': return 'admin-badge admin-badge-orange';
      case 'Premium User': return 'admin-badge admin-badge-red';
      default: return 'admin-badge admin-badge-gray'; 
    }
  };

  const getActivityStatusClass = (activityStatus) => {
    return activityStatus === "active" 
      ? "admin-badge admin-badge-green" 
      : "admin-badge admin-badge-red";
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

            {/* Show Loading and Error Messages */}
            {loading ? <p>Loading users...</p> : error ? <p className="error">{error}</p> : null}

            {/* Search Input */}
            <div className="admin-search-section">
              <div className="admin-search-container">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="admin-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* User Table */}
            <div className="admin-table-container">
              <table className="admin-user-table">
                <thead className="admins-table-head">
                  <tr>
                    <th className="admins-table-header">Name</th>
                    <th className="admins-table-header">Email</th>
                    <th className="admins-table-header">Role</th>
                    <th className="admins-table-header">Status</th>
                    <th className="admins-table-header">Activity Status</th>
                    <th className="admins-table-header">Contact Number</th>
                    <th className="admins-table-header admin-actions-column">Actions</th>
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
                            <div className="admin-user-name">{user.name}</div>
                          </div>
                        </td>
                        <td className="admin-table-cell">{user.email}</td>
                        <td className="admin-table-cell">
                          <span className={getRoleClass(user.role)}>{user.role}</span>
                        </td>
                        <td className="admin-table-cell">
                          <span className={getStatusClass(user.status)}>{user.status}</span>
                        </td>
                        <td className="admin-table-cell">
                          <span className={getActivityStatusClass(user.activity_status)}>
                            {user.activity_status === "active" ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="admin-table-cell admin-login-date">{user.contactNumber}</td>
                        <td className="admin-table-cell admin-actions-cell">
                          <div className="admin-action-buttons">
                            {user.role.includes("Admin") ? (
                              <span className="admin-btn-disabled">Cannot Modify Admin</span>
                            ) : user.activity_status === "active" ? (
                              <button
                              disabled={statusUpdating}
                                onClick={() => toggleUserStatus(user.id)}
                                className="admin-btn admin-btn-deactivate"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                              disabled={statusUpdating}

                                onClick={() => toggleUserStatus(user.id)}
                                className="admin-btn admin-btn-reactivate"
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="admin-empty-results">
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