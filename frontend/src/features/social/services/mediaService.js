// features/social/services/mediaService.js
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { BASE_URL } from '../../../constants/apiEndpoints';
import { mediaUtils } from '../utils/mediaUtils';

// API 인스턴스 생성
const api = axios.create({
    baseURL: `${BASE_URL}/media`,
    timeout: 30000,
    headers: {
        'Content-Type': 'multipart/form-data'
    }
});

// 에러 처리 유틸리티
const handleError = (error, defaultMessage) => {
    if (error.response) {
        const { status, data } = error.response;
        switch (status) {
            case 400:
                throw new Error(data.message || '잘못된 요청입니다.');
            case 401:
                throw new Error('인증이 필요합니다.');
            case 413:
                throw new Error('파일 크기가 너무 큽니다.');
            case 415:
                throw new Error('지원하지 않는 파일 형식입니다.');
            default:
                throw new Error(data.message || defaultMessage);
        }
    }
    throw new Error(error.message || defaultMessage);
};

// 이미지 유효성 검사
const validateImage = async (imageUri) => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
            throw new Error('이미지 파일이 존재하지 않습니다.');
        }

        // 파일 크기 제한 (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (fileInfo.size > maxSize) {
            throw new Error('이미지 크기가 너무 큽니다. (최대 10MB)');
        }

        // 이미지 형식 검사
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
        const extension = imageUri.toLowerCase().split('.').pop();
        if (!validExtensions.includes(`.${extension}`)) {
            throw new Error('지원하지 않는 이미지 형식입니다.');
        }
    } catch (error) {
        throw handleError(error, '이미지 검증에 실패했습니다.');
    }
};

// 파일 유효성 검사
const validateFile = async (fileUri) => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
            throw new Error('파일이 존재하지 않습니다.');
        }

        // 파일 크기 제한 (50MB)
        const maxSize = 50 * 1024 * 1024;
        if (fileInfo.size > maxSize) {
            throw new Error('파일 크기가 너무 큽니다. (최대 50MB)');
        }

        // 파일 형식 검사
        const validExtensions = mediaUtils.getSupportedExtensions();
        const extension = fileUri.toLowerCase().split('.').pop();
        if (!validExtensions.includes(extension)) {
            throw new Error('지원하지 않는 파일 형식입니다.');
        }
    } catch (error) {
        throw handleError(error, '파일 검증에 실패했습니다.');
    }
};

export const mediaService = {
    // API 요청 설정
    setAuthToken: (token) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    // 이미지 업로드
    uploadImage: async (imageUri, options = {}) => {
        try {
            await validateImage(imageUri);
            const optimizedImage = await mediaService.optimizeImage(imageUri, options);

            const formData = new FormData();
            formData.append('image', {
                uri: optimizedImage.uri,
                type: 'image/jpeg',
                name: 'image.jpg'
            });

            if (options.type) formData.append('type', options.type);
            if (options.chatId) formData.append('chatId', options.chatId);

            const response = await api.post('/upload/image', formData);
            return response.data;
        } catch (error) {
            throw handleError(error, '이미지 업로드에 실패했습니다.');
        }
    },

    // 파일 업로드
    uploadFile: async (fileUri, options = {}) => {
        try {
            await validateFile(fileUri);
            const fileName = fileUri.split('/').pop();

            const formData = new FormData();
            formData.append('file', {
                uri: fileUri,
                type: mediaUtils.getMimeType(fileName),
                name: fileName
            });

            if (options.type) formData.append('type', options.type);
            if (options.chatId) formData.append('chatId', options.chatId);

            const response = await api.post('/upload/file', formData);
            return response.data;
        } catch (error) {
            throw handleError(error, '파일 업로드에 실패했습니다.');
        }
    },

    // 이미지 다운로드
    downloadImage: async (imageUrl) => {
        try {
            const downloadPath = `${FileSystem.cacheDirectory}${Date.now()}.jpg`;
            const { uri } = await FileSystem.downloadAsync(imageUrl, downloadPath);
            return uri;
        } catch (error) {
            throw handleError(error, '이미지 다운로드에 실패했습니다.');
        }
    },

    // 파일 다운로드
    downloadFile: async (fileUrl, fileName) => {
        try {
            const downloadPath = `${FileSystem.documentDirectory}${fileName}`;
            const { uri } = await FileSystem.downloadAsync(fileUrl, downloadPath);
            return uri;
        } catch (error) {
            throw handleError(error, '파일 다운로드에 실패했습니다.');
        }
    },

    // 이미지 최적화
    optimizeImage: async (imageUri, options = {}) => {
        try {
            const actions = [];

            if (options.resize) {
                actions.push({
                    resize: {
                        width: options.resize.width || 1024,
                        height: options.resize.height
                    }
                });
            }

            const quality = options.quality || 0.8;

            return await ImageManipulator.manipulateAsync(
                imageUri,
                actions,
                {
                    compress: quality,
                    format: ImageManipulator.SaveFormat.JPEG
                }
            );
        } catch (error) {
            throw handleError(error, '이미지 최적화에 실패했습니다.');
        }
    },

    // 캐시 정리
    clearCache: async () => {
        try {
            await FileSystem.deleteAsync(FileSystem.cacheDirectory, { idempotent: true });
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }
};

export default mediaService;