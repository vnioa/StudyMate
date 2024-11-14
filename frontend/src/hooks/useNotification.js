// src/hooks/useNotification.js

import { useContext, useCallback } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';

const useNotification = () => {
    const {
        notifications,
        loading,
        error,
        loadNotifications,
        addNotification,
        markAsRead,
    } = useContext(NotificationContext);

    // 알림 목록 새로 고침
    const refreshNotifications = useCallback(() => {
        loadNotifications();
    }, [loadNotifications]);

    // 새 알림 추가
    const addNewNotification = useCallback(
        (notification) => {
            addNotification(notification);
        },
        [addNotification]
    );

    // 알림 읽음 상태로 표시
    const markNotificationAsRead = useCallback(
        (notificationId) => {
            markAsRead(notificationId);
        },
        [markAsRead]
    );

    return {
        notifications,
        loading,
        error,
        refreshNotifications,
        addNewNotification,
        markNotificationAsRead,
    };
};

export default useNotification;
