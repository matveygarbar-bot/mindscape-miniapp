import React, { useState, useEffect } from 'react';

const Notifications = ({ notifications, removeNotification }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notifications-container">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`notification ${notification.type || 'info'}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' ? '✅' : 
               notification.type === 'warning' ? '⚠️' : 
               notification.type === 'error' ? '❌' : '🔔'}
            </span>
            <div className="notification-text">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
            </div>
          </div>
          <button className="close-notification">×</button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;