import { useState } from 'react';
import { Alert } from 'react-native';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSignUp = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const register = async (userData) => {
        try {
            setLoading(true);
            setError(null);

            // 입력값 유효성 검사
            if (!userData.username || !userData.password || !userData.email) {
                throw new Error('모든 필수 항목을 입력해주세요.');
            }

            // 회원가입 API 호출
            const response = await authAPI.register({
                username: userData.username.trim(),
                password: userData.password,
                email: userData.email.trim()
            });

            if (response.data.success) {
                // 회원가입 성공 시 임시 데이터 삭제
                await AsyncStorage.removeItem('tempUsername');
                await AsyncStorage.removeItem('tempEmail');

                return {
                    success: true,
                    data: response.data
                };
            } else {
                throw new Error(response.data.message || '회원가입에 실패했습니다.');
            }

        } catch (err) {
            setError(err.message || '회원가입 처리 중 오류가 발생했습니다.');
            Alert.alert('오류', err.message || '회원가입 처리 중 오류가 발생했습니다.');
            return {
                success: false,
                error: err.message
            };
        } finally {
            setLoading(false);
        }
    };

    const validateUsername = async (username) => {
        try {
            const response = await authAPI.checkUsername(username);
            return response.data.available;
        } catch (err) {
            setError('아이디 중복 확인에 실패했습니다.');
            return false;
        }
    };

    const validateEmail = async (email) => {
        try {
            const response = await authAPI.checkEmail(email);
            return response.data.available;
        } catch (err) {
            setError('이메일 중복 확인에 실패했습니다.');
            return false;
        }
    };

    const sendVerificationEmail = async (email) => {
        try {
            const response = await authAPI.sendVerificationEmail(email);
            return response.data.success;
        } catch (err) {
            setError('인증 메일 발송에 실패했습니다.');
            return false;
        }
    };

    const verifyEmail = async (email, code) => {
        try {
            const response = await authAPI.verifyEmail(email, code);
            return response.data.success;
        } catch (err) {
            setError('이메일 인증에 실패했습니다.');
            return false;
        }
    };

    return {
        register,
        validateUsername,
        validateEmail,
        sendVerificationEmail,
        verifyEmail,
        loading,
        error
    };
};