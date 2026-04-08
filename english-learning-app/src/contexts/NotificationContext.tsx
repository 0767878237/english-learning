import React, { createContext, useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationMessage {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationMessage[];
  addNotification: (type: NotificationType, message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  const addNotification = useCallback(
    (type: NotificationType, message: string, duration?: number) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newNotification: NotificationMessage = {
        id,
        type,
        message,
        duration: duration ?? 3000,
      };

      setNotifications(prev => [...prev, newNotification]);

      // Auto-remove notification if duration is set and not 0
      if ((duration ?? 3000) !== 0) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(notif => notif.id !== id));
        }, duration ?? 3000);
      }
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
