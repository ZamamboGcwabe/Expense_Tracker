import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1>💰 Expense Tracker</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/">Dashboard</Link>
          <Link to="/expenses">Expenses</Link>
          <Link to="/budget">Budget</Link>
          <span>Welcome, {user.name}</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
