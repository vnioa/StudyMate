// src/contexts/SecurityContext.js

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { loginUser, logoutUser, checkAuthStatus } from '../api/securityAPI';

const SecurityContext = createContext();

const initialState = {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
};

const securityReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            return { ...state, isAuthenticated: true, user: action.payload, error: null };
        case 'LOGOUT':
            return { ...state, isAuthenticated: false, user: null };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

export const SecurityProvider = ({ children }) => {
    const [state, dispatch] = useReducer(securityReducer, initialState);

    // 로그인
    const login = async (credentials) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const user = await loginUser(credentials);
            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Login failed' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // 로그아웃
    const logout = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            await logoutUser();
            dispatch({ type: 'LOGOUT' });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Logout failed' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // 인증 상태 확인
    const verifyAuth = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const user = await checkAuthStatus();
            if (user) {
                dispatch({ type: 'LOGIN_SUCCESS', payload: user });
            } else {
                dispatch({ type: 'LOGOUT' });
            }
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Authentication check failed' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    useEffect(() => {
        verifyAuth();
    }, []);

    return (
        <SecurityContext.Provider
            value={{
                isAuthenticated: state.isAuthenticated,
                user: state.user,
                loading: state.loading,
                error: state.error,
                login,
                logout,
                verifyAuth,
            }}
        >
            {children}
        </SecurityContext.Provider>
    );
};

export const useSecurity = () => useContext(SecurityContext);
