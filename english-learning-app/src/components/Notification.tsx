import React, { useEffect, useState } from 'react';
import './Notification.css';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationMessage {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationItemProps {
  notification: NotificationMessage;
  onClose: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(notification.id);
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  return (
    <div className={`notification notification-${notification.type}`}>
      <div className="notification-content">
        <span className="notification-icon">
          {notification.type === 'success' && '✓'}
          {notification.type === 'error' && '✕'}
          {notification.type === 'warning' && '⚠'}
          {notification.type === 'info' && 'ℹ'}
        </span>
        <p className="notification-message">{notification.message}</p>
      </div>
      <button
        className="notification-close"
        onClick={() => onClose(notification.id)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

interface NotificationContainerProps {
  notifications: NotificationMessage[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
