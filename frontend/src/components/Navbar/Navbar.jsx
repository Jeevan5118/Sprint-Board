import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      if (!user || user.role === 'admin') return;
      try {
        const data = await notificationService.getMyUnread();
        if (mounted) {
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Failed to load notifications', error);
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications([]);
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

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
            {user.role !== 'admin' && (
              <div className="navbar-notifications">
                <button
                  type="button"
                  className="navbar-bell"
                  onClick={() => setShowNotifications((prev) => !prev)}
                >
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <span className="navbar-notification-count">{notifications.length}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="navbar-notification-panel">
                    <div className="navbar-notification-header">
                      <strong>Assigned Tasks</strong>
                      {notifications.length > 0 && (
                        <button type="button" className="navbar-mark-all" onClick={handleMarkAllAsRead}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="navbar-notification-empty">No new task assignments.</div>
                    ) : (
                      <div className="navbar-notification-list">
                        {notifications.map((notification) => (
                          <button
                            type="button"
                            key={notification.id}
                            className="navbar-notification-item"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <span className="navbar-notification-text">{notification.message}</span>
                            <span className="navbar-notification-time">
                              {new Date(notification.created_at).toLocaleString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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

