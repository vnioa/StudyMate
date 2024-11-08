// src/utils/helpers.js

import { Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { format, parseISO, differenceInDays, differenceInMinutes } from 'date-fns';
import ko from 'date-fns/locale/ko';

const { width, height } = Dimensions.get('window');

// 화면 크기 관련
export const screen = {
    width,
    height,
    isSmallDevice: width < 375,
    scale: width / 375, // 디자인 기준 너비
};

// 파일 관련
export const file = {
    // 파일 크기 포맷
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    },

    // 파일 확장자 체크
    checkFileType: (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif'];
        const videoTypes = ['mp4', 'mov', 'avi'];
        const docTypes = ['pdf', 'doc', 'docx', 'txt'];

        if (imageTypes.includes(extension)) return 'image';
        if (videoTypes.includes(extension)) return 'video';
        if (docTypes.includes(extension)) return 'document';
        return 'unknown';
    },

    // 이미지 선택
    pickImage: async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                return result.assets[0];
            }
            return null;
        } catch (error) {
            console.error('Image pick error:', error);
            return null;
        }
    }
};

// 날짜 관련
export const date = {
    // 날짜 포맷
    format: (date, formatStr = 'yyyy-MM-dd') => {
        if (!date) return '';
        try {
            const dateObj = typeof date === 'string' ? parseISO(date) : date;
            return format(dateObj, formatStr, { locale: ko });
        } catch (error) {
            return '';
        }
    },

    // 상대적 시간 표시
    formatRelative: (date) => {
        try {
            const dateObj = typeof date === 'string' ? parseISO(date) : date;
            const minutes = differenceInMinutes(new Date(), dateObj);

            if (minutes < 1) return '방금 전';
            if (minutes < 60) return `${minutes}분 전`;

            const days = differenceInDays(new Date(), dateObj);
            if (days < 1) return `${Math.floor(minutes / 60)}시간 전`;
            if (days < 7) return `${days}일 전`;

            return format(dateObj, 'M월 d일', { locale: ko });
        } catch (error) {
            return '';
        }
    },

    // 학습 시간 포맷
    formatStudyTime: (minutes) => {
        if (minutes < 60) return `${minutes}분`;
        const hours = Math.floor(minutes / 60);
        const remainMinutes = minutes % 60;
        return remainMinutes > 0 ? `${hours}시간 ${remainMinutes}분` : `${hours}시간`;
    }
};

// 문자열 관련
export const string = {
    // 이메일 유효성 검사
    isValidEmail: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // 비밀번호 유효성 검사 (8자 이상, 영문/숫자/특수문자)
    isValidPassword: (password) => {
        const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        return regex.test(password);
    },

    // 전화번호 포맷
    formatPhoneNumber: (number) => {
        if (!number) return '';
        return number.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    },

    // 텍스트 길이 제한
    truncate: (text, length = 30) => {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
};

// 숫자 관련
export const number = {
    // 천 단위 콤마
    formatNumber: (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // 퍼센트 계산
    calculatePercent: (value, total) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    },

    // 평균 계산
    calculateAverage: (numbers) => {
        if (!numbers.length) return 0;
        return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
    }
};

// 디바이스 관련
export const device = {
    // 플랫폼 체크
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',

    // 노치 디스플레이 여부
    hasNotch: Platform.OS === 'ios' && !Platform.isPad && !Platform.isTVOS && height >= 812,

    // 스크린 패딩
    screenPadding: {
        top: Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : 0,
        bottom: Platform.OS === 'ios' ? (height >= 812 ? 34 : 0) : 0
    }
};

// 저장소 관련
export const storage = {
    // 데이터 저장
    setItem: async (key, value) => {
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, jsonValue);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    // 데이터 불러오기
    getItem: async (key) => {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    },

    // 데이터 삭제
    removeItem: async (key) => {
        try {
            await AsyncStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }
};

// 학습 관련
export const study = {
    // 학습 시간 계산
    calculateStudyTime: (startTime, endTime) => {
        return differenceInMinutes(
            endTime ? parseISO(endTime) : new Date(),
            parseISO(startTime)
        );
    },

    // 학습 성과 평가
    evaluatePerformance: (currentScore, previousScore) => {
        const difference = currentScore - previousScore;
        const percentChange = (difference / previousScore) * 100;

        if (percentChange > 10) return '크게 향상';
        if (percentChange > 0) return '향상';
        if (percentChange === 0) return '유지';
        return '노력 필요';
    },

    // 추천 학습 시간 계산
    calculateRecommendedTime: (difficulty, userLevel) => {
        const baseTime = 30; // 기본 30분
        const difficultyFactor = { easy: 0.8, medium: 1, hard: 1.2 };
        const levelFactor = Math.max(0.5, Math.min(1.5, userLevel / 10));

        return Math.round(baseTime * difficultyFactor[difficulty] * levelFactor);
    }
};

export default {
    screen,
    file,
    date,
    string,
    number,
    device,
    storage,
    study
};