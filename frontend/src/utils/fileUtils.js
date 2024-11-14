// utils/fileUtils.js

import {Alert} from 'react-native';
import ImageResizer from 'react-native-image-resizer'
/**
 * Checks if a file is within the specified size limit.
 * @param {File} file - The file to check.
 * @param {number} maxSize - The maximum size in bytes.
 * @returns {boolean} True if the file is within the size limit; false otherwise.
 */
export const isFileSizeWithinLimit = (file, maxSize) => {
    return file.size <= maxSize;
};

/**
 * compressImageFile - 이미지 파일 압축 후 전송
 * @param {Object} file - 전송할 이미지 파일 (URI 포함)
 * @param {number} maxWidth - 압축 이미지 최대 너비
 * @param {number} maxHeight - 압축 이미지 최대 높이
 * @param {number} quality - 압축 품질 (0.1 ~ 1.0)
 * @returns {Object} - 압축된 이미지 파일 객체
 */
export const compressImageFile = async (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    try {
        const compressedImage = await ImageResizer.createResizedImage(
            file.uri,      // 원본 이미지 URI
            maxWidth,      // 최대 너비
            maxHeight,     // 최대 높이
            'JPEG',        // 압축 포맷
            quality * 100  // 압축 품질 (0-100)
        );

        // 압축된 파일 URI와 추가 정보 반환
        return {
            uri: compressedImage.uri,
            name: file.name || 'compressed_image.jpg',
            type: 'image/jpeg',
            size: compressedImage.size,
        };
    } catch (error) {
        console.error('Image compression failed:', error);
        throw error;
    }
};

/**
 * Converts a file to Base64 format.
 * @param {File} file - The file to convert.
 * @returns {Promise<string>} The Base64 string.
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// 파일 크기가 제한을 초과하는 지 확인(5 MB)
export const isFileSizeValid = (file, maxSize = 5 * 1024 * 1024) => {
    return file.size <= maxSize;
}

// 파일 알림
export const showFileAlert = (message) => {
    Alert.alert('파일 알림', message);
}

/**
 * sortFilesByDate - Sorts files by date in descending order (latest first).
 * @param {Array} files - Array of file objects, each containing a 'date' property.
 * @returns {Array} - Sorted array of files.
 */
export const sortFilesByDate = (files) => {
    return files.sort((a, b) => new Date(b.date) - new Date(a.date));
};