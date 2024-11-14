// src/hooks/useSecurity.js

import { useContext, useCallback } from 'react';
import { SecurityContext } from '../contexts/SecurityContext';

const useSecurity = () => {
    const {
        isAuthenticated,
        user,
        loading,
        error,
        login,
        logout,
        verifyAuth,
    } = useContext(SecurityContext);

    // 로그인 실행
    const executeLogin = useCallback(
        async (credentials) => {
            try {
                await login(credentials);
            } catch (err) {
                console.error("Login error:", err);
            }
        },
        [login]
    );

    // 로그아웃 실행
    const executeLogout = useCallback(async () => {
        try {
            await logout();
        } catch (err) {
            console.error("Logout error:", err);
        }
    }, [logout]);

    // 인증 상태 확인
    const checkAuthStatus = useCallback(async () => {
        try {
            await verifyAuth();
        } catch (err) {
            console.error("Authentication check error:", err);
        }
    }, [verifyAuth]);

    return {
        isAuthenticated,
        user,
        loading,
        error,
        executeLogin,
        executeLogout,
        checkAuthStatus,
    };
};

export default useSecurity;
