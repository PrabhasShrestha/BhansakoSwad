import React from "react";
import "../styles/Vendor/Sidebar.css"; // Ensure Sidebar.css exists

const Sidebar = () => {
  return (
    <aside className="dashboard-sidebar">
      <h2 className="dashboard-title">Dashboard</h2>
      <nav>
        <ul className="dashboard-menu">
          <li className="dashboard-menu-item">
            <a href="/dashboard">Overview</a>
          </li>
          <li className="dashboard-menu-item">
            <a href="/product">Products</a>
          </li>
          <li className="dashboard-menu-item">
            <a href="/order">Orders</a>
          </li>
          <li className="dashboard-menu-item">
            <a href="/sellerprofile">Account</a>
          </li>
          <li className="dashboard-menu-item">
            <a href="/vendor/store">View your Store</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
