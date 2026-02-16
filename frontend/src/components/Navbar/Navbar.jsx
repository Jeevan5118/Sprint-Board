import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="navbar-logo">Scrum Board</span>
        <span className="navbar-divider" />
        <span className="navbar-subtitle">Agile Sprint Management</span>
      </div>
      <div className="navbar-right">
        {user && (
          <>
            <span className="navbar-user">
              <span className="navbar-avatar">
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </span>
              <span className="navbar-user-meta">
                <span className="navbar-user-name">
                  {user.first_name} {user.last_name}
                </span>
                <span className="navbar-user-role">{user.role}</span>
              </span>
            </span>
            <button className="navbar-logout" type="button" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;

