// features/social/utils/mediaUtils.js
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

const mediaUtils = {
    // 지원되는 이미지 형식
    supportedImageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],

    // 지원되는 비디오 형식
    supportedVideoTypes: ['mp4', 'mov', 'avi', 'mkv'],

    // 지원되는 오디오 형식
    supportedAudioTypes: ['mp3', 'wav', 'aac', 'm4a'],

    // 파일 크기 제한 (bytes)
    maxFileSize: {
        image: 10 * 1024 * 1024, // 10MB
        video: 50 * 1024 * 1024, // 50MB
        audio: 20 * 1024 * 1024, // 20MB
        file: 100 * 1024 * 1024  // 100MB
    },

    // MIME 타입 가져오기
    getMimeType: (fileName) => {
        const ext = fileName.toLowerCase().split('.').pop();
        const mimeTypes = {
            // 이미지
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            // 비디오
            mp4: 'video/mp4',
            mov: 'video/quicktime',
            avi: 'video/x-msvideo',
            mkv: 'video/x-matroska',
            // 오디오
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            aac: 'audio/aac',
            m4a: 'audio/mp4',
            // 문서
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    },

    // 파일 확장자 검증
    isValidFileType: (fileName, type = 'all') => {
        const ext = fileName.toLowerCase().split('.').pop();
        switch (type) {
            case 'image':
                return mediaUtils.supportedImageTypes.includes(ext);
            case 'video':
                return mediaUtils.supportedVideoTypes.includes(ext);
            case 'audio':
                return mediaUtils.supportedAudioTypes.includes(ext);
            case 'all':
                return [...mediaUtils.supportedImageTypes,
                    ...mediaUtils.supportedVideoTypes,
                    ...mediaUtils.supportedAudioTypes].includes(ext);
            default:
                return false;
        }
    },

    // 파일 크기 검증
    isValidFileSize: (fileSize, type = 'file') => {
        return fileSize <= mediaUtils.maxFileSize[type];
    },

    // 이미지 선택
    pickImage: async (options = {}) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('카메라 롤 접근 권한이 필요합니다.');
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                ...options
            });

            if (!result.canceled) {
                return result.assets[0];
            }
            return null;
        } catch (error) {
            console.error('Image Pick Error:', error);
            throw error;
        }
    },

    // 카메라로 촬영
    takePhoto: async (options = {}) => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('카메라 접근 권한이 필요합니다.');
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                ...options
            });

            if (!result.canceled) {
                return result.assets[0];
            }
            return null;
        } catch (error) {
            console.error('Camera Error:', error);
            throw error;
        }
    },

    // 파일 저장
    saveFile: async (fileUri, fileName) => {
        try {
            if (Platform.OS === 'android') {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    throw new Error('저장소 접근 권한이 필요합니다.');
                }
            }

            const asset = await MediaLibrary.createAssetAsync(fileUri);
            await MediaLibrary.createAlbumAsync('MyApp', asset, false);
            return true;
        } catch (error) {
            console.error('File Save Error:', error);
            throw error;
        }
    },

    // 파일 삭제
    deleteFile: async (fileUri) => {
        try {
            await FileSystem.deleteAsync(fileUri);
            return true;
        } catch (error) {
            console.error('File Delete Error:', error);
            throw error;
        }
    },

    // 파일 정보 가져오기
    getFileInfo: async (fileUri) => {
        try {
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            return {
                ...fileInfo,
                mimeType: mediaUtils.getMimeType(fileUri),
                isValid: mediaUtils.isValidFileType(fileUri) &&
                    mediaUtils.isValidFileSize(fileInfo.size)
            };
        } catch (error) {
            console.error('File Info Error:', error);
            throw error;
        }
    },

    // 이미지 크기 조정
    formatImageDimensions: (width, height, maxSize = 1024) => {
        if (width <= maxSize && height <= maxSize) {
            return { width, height };
        }

        if (width > height) {
            return {
                width: maxSize,
                height: Math.round((height / width) * maxSize)
            };
        }

        return {
            width: Math.round((width / height) * maxSize),
            height: maxSize
        };
    },

    // 파일 크기 포맷팅
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
};

export default mediaUtils;