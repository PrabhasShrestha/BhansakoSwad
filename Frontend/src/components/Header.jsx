import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Header.css';

const Navbar = () => {
  return (
    <header className="header">
      {/* Logo */}
      <NavLink to="/" className="logo">
        Bhansako Swad
      </NavLink>

      {/* Navigation Links */}
      <nav className="nav">
        <NavLink
          to="/"
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
          to="/signUp"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Store
        </NavLink>
      </nav>

      {/* User Icon */}
      <div className="user-icon">
        <a href="/signUp" title="Sign Up" style={{ textDecoration: 'none', color: 'inherit' }}>
          👤
        </a>
      </div>
    </header>
  );
};

export default Navbar;
