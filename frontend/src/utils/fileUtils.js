// utils/fileUtils.js

import {Alert} from 'react-native';
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
 * Compresses an image file using a specific quality.
 * Note: Requires an image processing library like `expo-image-manipulator` for React Native.
 * @param {File} file - The image file to compress.
 * @param {number} quality - The compression quality (0 to 1).
 * @returns {File} The compressed image file.
 */
import * as ImageManipulator from 'expo-image-manipulator';

export const compressImage = async (file, quality = 0.7) => {
    return await ImageManipulator.manipulate(
        file.uri,
        [{resize: {width: file.width * quality, height: file.height * quality}}],
        {compress: quality, format: ImageManipulator.SaveFormat.JPEG}
    );
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

// 파일 압축
export const compressImage = async (imageUrl) => {
    // 이미지 압축 로직
    return imageUrl;
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