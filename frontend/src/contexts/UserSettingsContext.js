// src/contexts/UserSettingsContext.js

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { fetchUserSettings, updateUserSettings } from '../api/userSettingsAPI';

const UserSettingsContext = createContext();

const initialState = {
    theme: 'light',         // 'light' or 'dark'
    language: 'en',          // 'en', 'ko', etc.
    notificationsEnabled: true,
    loading: false,
    error: null,
};

const settingsReducer = (state, action) => {
    switch (action.type) {
        case 'SET_SETTINGS':
            return { ...state, ...action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'UPDATE_SETTING':
            return { ...state, [action.payload.key]: action.payload.value };
        default:
            return state;
    }
};

export const UserSettingsProvider = ({ children }) => {
    const [state, dispatch] = useReducer(settingsReducer, initialState);

    // 사용자 설정 불러오기
    const loadSettings = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const settings = await fetchUserSettings();
            dispatch({ type: 'SET_SETTINGS', payload: settings });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load user settings' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // 사용자 설정 업데이트
    const updateSetting = async (key, value) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            await updateUserSettings({ [key]: value });
            dispatch({ type: 'UPDATE_SETTING', payload: { key, value } });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: `Failed to update ${key}` });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    return (
        <UserSettingsContext.Provider
            value={{
                theme: state.theme,
                language: state.language,
                notificationsEnabled: state.notificationsEnabled,
                loading: state.loading,
                error: state.error,
                updateSetting,
            }}
        >
            {children}
        </UserSettingsContext.Provider>
    );
};

export const useUserSettings = () => useContext(UserSettingsContext);
