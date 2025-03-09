// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/Admin/AdminDashboard.css';
import AdminSidebar from '../../components/AdminSidebar';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalRecipes: 0,
    pendingOrders: 0,
    pendingTestimonials: 0,
    pendingChefs: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    // In a real application, you would fetch this data from your API
    setStats({
      totalOrders: 256,
      totalUsers: 128,
      totalProducts: 64,
      totalRecipes: 95,
      pendingOrders: 12,
      pendingTestimonials: 8,
      pendingChefs: 5
    });

    setRecentOrders([
      { id: '1001', customer: 'John Doe', date: '2025-03-07', status: 'Delivered', total: '$89.99' },
      { id: '1002', customer: 'Jane Smith', date: '2025-03-07', status: 'Processing', total: '$124.50' },
      { id: '1003', customer: 'Bob Johnson', date: '2025-03-06', status: 'Pending', total: '$56.75' },
      { id: '1004', customer: 'Alice Brown', date: '2025-03-06', status: 'Shipped', total: '$210.25' },
    ]);

    setRecentUsers([
      { id: '2001', name: 'Mike Wilson', email: 'mike@example.com', role: 'Customer', joined: '2025-03-07' },
      { id: '2002', name: 'Sarah Davis', email: 'sarah@example.com', role: 'Seller', joined: '2025-03-06' },
      { id: '2003', name: 'Carlos Rodriguez', email: 'carlos@example.com', role: 'Chef', joined: '2025-03-05' },
      { id: '2004', name: 'Emma Johnson', email: 'emma@example.com', role: 'Customer', joined: '2025-03-05' },
    ]);
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1 className="admin-title">Dashboard</h1>
      </div>

      <div className="admin-dashboard-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">🛒</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-value">{stats.totalOrders}</h3>
            <p className="admin-stat-label">Total Orders</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-value">{stats.totalUsers}</h3>
            <p className="admin-stat-label">Total Users</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">📦</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-value">{stats.totalProducts}</h3>
            <p className="admin-stat-label">Products</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">🍲</div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-value">{stats.totalRecipes}</h3>
            <p className="admin-stat-label">Recipes</p>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-alerts">
        <div className="admin-alert-card">
          <div className="admin-alert-icon admin-alert-warning">⚠️</div>
          <div className="admin-alert-content">
            <h3 className="admin-alert-value">{stats.pendingOrders}</h3>
            <p className="admin-alert-label">Pending Orders</p>
          </div>
        </div>
        <div className="admin-alert-card">
          <div className="admin-alert-icon admin-alert-info">💬</div>
          <div className="admin-alert-content">
            <h3 className="admin-alert-value">{stats.pendingTestimonials}</h3>
            <p className="admin-alert-label">Pending Testimonials</p>
          </div>
        </div>
        <div className="admin-alert-card">
          <div className="admin-alert-icon admin-alert-info">👨‍🍳</div>
          <div className="admin-alert-content">
            <h3 className="admin-alert-value">{stats.pendingChefs}</h3>
            <p className="admin-alert-label">Pending Chefs</p>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-recent">
        <div className="admin-card admin-recent-orders">
          <h2 className="admin-card-title">Recent Orders</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.date}</td>
                  <td>
                    <span className={`admin-status admin-status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-card admin-recent-users">
          <h2 className="admin-card-title">Recent Users</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(user => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`admin-role admin-role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default AdminDashboard;