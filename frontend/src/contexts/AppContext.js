// src/contexts/AppContext.js

import React, { createContext, useContext, useReducer } from 'react';

// 초기 상태
const initialState = {
    auth: {
        isAuthenticated: false,
        user: null,
        token: null
    },
    app: {
        isLoading: false,
        isOnline: true,
        lastSync: null
    },
    settings: {
        pushNotifications: true,
        emailNotifications: true,
        soundEnabled: true,
        language: 'ko'
    }
};

// 액션 타입
const ActionTypes = {
    SET_AUTH: 'SET_AUTH',
    LOGOUT: 'LOGOUT',
    SET_LOADING: 'SET_LOADING',
    SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
    UPDATE_SETTINGS: 'UPDATE_SETTINGS',
    SET_LAST_SYNC: 'SET_LAST_SYNC'
};

// 리듀서
function appReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_AUTH:
            return {
                ...state,
                auth: {
                    isAuthenticated: true,
                    user: action.payload.user,
                    token: action.payload.token
                }
            };

        case ActionTypes.LOGOUT:
            return {
                ...state,
                auth: {
                    isAuthenticated: false,
                    user: null,
                    token: null
                }
            };

        case ActionTypes.SET_LOADING:
            return {
                ...state,
                app: {
                    ...state.app,
                    isLoading: action.payload
                }
            };

        case ActionTypes.SET_ONLINE_STATUS:
            return {
                ...state,
                app: {
                    ...state.app,
                    isOnline: action.payload
                }
            };

        case ActionTypes.UPDATE_SETTINGS:
            return {
                ...state,
                settings: {
                    ...state.settings,
                    ...action.payload
                }
            };

        case ActionTypes.SET_LAST_SYNC:
            return {
                ...state,
                app: {
                    ...state.app,
                    lastSync: action.payload
                }
            };

        default:
            return state;
    }
}

// Context 생성
const AppContext = createContext();

// Provider 컴포넌트
export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // 액션 생성자 함수들
    const actions = {
        setAuth: (user, token) => {
            dispatch({
                type: ActionTypes.SET_AUTH,
                payload: { user, token }
            });
        },

        logout: () => {
            dispatch({ type: ActionTypes.LOGOUT });
        },

        setLoading: (isLoading) => {
            dispatch({
                type: ActionTypes.SET_LOADING,
                payload: isLoading
            });
        },

        setOnlineStatus: (isOnline) => {
            dispatch({
                type: ActionTypes.SET_ONLINE_STATUS,
                payload: isOnline
            });
        },

        updateSettings: (settings) => {
            dispatch({
                type: ActionTypes.UPDATE_SETTINGS,
                payload: settings
            });
        },

        setLastSync: (timestamp) => {
            dispatch({
                type: ActionTypes.SET_LAST_SYNC,
                payload: timestamp
            });
        }
    };

    return (
        <AppContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </AppContext.Provider>
    );
}

// Custom Hook
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

// Action Types 외부 노출
export { ActionTypes };