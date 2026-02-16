import React from 'react';
import { useLocation } from 'react-router-dom';

const Layout = ({ navbar, sidebar, children }) => {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthRoute) {
    return <main>{children}</main>;
  }

  return (
    <div className="app-shell">
      <div className="app-shell-navbar">{navbar}</div>
      <div className="app-shell-main">
        <div className="app-shell-sidebar">{sidebar}</div>
        <main className="app-shell-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

