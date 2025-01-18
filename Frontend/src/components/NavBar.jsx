import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Header.css';

const Navigationbar = () => {
  return (
    <header className="header">
      {/* Logo */}
      <NavLink to="/" className="logo">
        Bhansako Swad
      </NavLink>

      {/* Navigation Links */}
      <nav className="nav">
        <NavLink
          to="/home"
          className={({ isActive }) => (isActive ? 'active' : '')}
          end
        >
          Home
        </NavLink>
        <NavLink
          to="/recipes"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Recipes
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          About
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Contact Us
        </NavLink>
        <NavLink
          to="/store"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Store
        </NavLink>
      </nav>

      {/* User Icon */}
      <div className="user-icon">
        <a href="/userProfile" title="User Profile" style={{ textDecoration: 'none', color: 'inherit' }}>
          👤
        </a>
      </div>
    </header>
  );
};

export default Navigationbar;
