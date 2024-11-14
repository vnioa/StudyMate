// src/contexts/NotificationContext.js

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { fetchNotifications, markNotificationAsRead } from '../api/notificationAPI';

const NotificationContext = createContext();

const initialState = {
    notifications: [],
    loading: false,
    error: null,
};

const notificationReducer = (state, action) => {
    switch (action.type) {
        case 'SET_NOTIFICATIONS':
            return { ...state, notifications: action.payload };
        case 'ADD_NOTIFICATION':
            return { ...state, notifications: [action.payload, ...state.notifications] };
        case 'MARK_AS_READ':
            return {
                ...state,
                notifications: state.notifications.map((notification) =>
                    notification.id === action.payload ? { ...notification, read: true } : notification
                ),
            };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

export const NotificationProvider = ({ children }) => {
    const [state, dispatch] = useReducer(notificationReducer, initialState);

    // 알림 목록 불러오기
    const loadNotifications = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const notifications = await fetchNotifications();
            dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load notifications' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // 새 알림 추가
    const addNotification = (notification) => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    };

    // 알림 읽음 상태 업데이트
    const markAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);
            dispatch({ type: 'MARK_AS_READ', payload: notificationId });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to mark notification as read' });
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications: state.notifications,
                loading: state.loading,
                error: state.error,
                loadNotifications,
                addNotification,
                markAsRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
