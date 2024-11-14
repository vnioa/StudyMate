// utils/encryptionUtils.js

import CryptoJS from 'crypto-js';

const SECRET_KEY = 'my-secret-key'; // Replace with an actual secure key

/**
 * Encrypts a text using AES encryption.
 * @param {string} text - The plain text to encrypt.
 * @returns {string} The encrypted text.
 */
export const encryptText = (text) => {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

/**
 * Decrypts an AES-encrypted text.
 * @param {string} encryptedText - The encrypted text.
 * @param SECRET_KEY
 * @returns {string} The decrypted text.
 */
export const decryptText = (encryptedText, SECRET_KEY) => {
    const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Generates an SHA-256 hash for a given text.
 * @param {string} text - The text to hash.
 * @returns {string} The hash of the text.
 */
export const generateHash = (text) => {
    return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
};

// 파일 암호화
export const encryptFile = (fileData, SECRET_KEY) => {
    return CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(fileData), SECRET_KEY).toString();
};

// 파일 복호화
export const decryptFile = (encryptedFileData, SECRET_KEY) => {
    return CryptoJS.AES.decrypt(encryptedFileData, SECRET_KEY);
};