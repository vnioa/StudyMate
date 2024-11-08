// src/contexts/NotificationContext.js

import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (notification) => {
        const id = Date.now().toString();
        const newNotification = {
            id,
            ...notification,
            timestamp: new Date()
        };

        setNotifications(prev => [newNotification, ...prev]);

        // 자동 삭제 (5초 후)
        if (notification.autoClose !== false) {
            setTimeout(() => {
                removeNotification(id);
            }, notification.duration || 5000);
        }
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                addNotification,
                removeNotification,
                clearNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotification = () => useContext(NotificationContext);