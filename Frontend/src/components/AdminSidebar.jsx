// AdminSidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Admin/AdminSidebar.css'

const AdminSidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    { path: '/admindashboard', icon: '📊', label: 'Dashboard' },
    { path: '/adminorder', icon: '🛒', label: 'Orders' },
    { path: '/adminuserpanel', icon: '👥', label: 'Users' },
    { path: '/adminproducts', icon: '📦', label: 'Products' },
    { path: '/adminrecipes', icon: '🍲', label: 'Recipes' },
    { path: '/admintestimonials', icon: '💬', label: 'Testimonials' },
    { path: '/adminchef', icon: '👨‍🍳', label: 'Chef Administration' },
    { path: '/', icon: '<-', label: 'View Website' },
  ];

  return (
    <div className={`admin-sidebar ${isCollapsed ? 'admin-sidebar-collapsed' : ''}`}>
      <div className="admin-sidebar-header">
        <h2 className={`admin-sidebar-title ${isCollapsed ? 'admin-sidebar-title-hidden' : ''}`}>
          Admin Panel
        </h2>
        <button className="admin-sidebar-toggle" onClick={toggleSidebar}>
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="admin-sidebar-nav">
        <ul className="admin-sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path} className="admin-sidebar-item">
              <Link
                to={item.path}
                className={`admin-sidebar-link ${
                  location.pathname === item.path ? 'admin-sidebar-active' : ''
                }`}
              >
                <span className="admin-sidebar-icon">{item.icon}</span>
                <span className={`admin-sidebar-label ${isCollapsed ? 'admin-sidebar-label-hidden' : ''}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;