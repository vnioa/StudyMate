// features/social/utils/encryptionUtils.js
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import { ENCRYPTION_KEY } from '../../../config';

const encryptionUtils = {
    // 데이터 암호화
    encrypt: (data) => {
        try {
            if (!data) return null;

            const stringData = typeof data === 'object' ? JSON.stringify(data) : String(data);
            return CryptoJS.AES.encrypt(stringData, ENCRYPTION_KEY).toString();
        } catch (error) {
            console.error('Encryption Error:', error);
            return null;
        }
    },

    // 데이터 복호화
    decrypt: (encryptedData) => {
        try {
            if (!encryptedData) return null;

            const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

            try {
                return JSON.parse(decryptedString);
            } catch {
                return decryptedString;
            }
        } catch (error) {
            console.error('Decryption Error:', error);
            return null;
        }
    },

    // 해시 생성
    createHash: (data) => {
        try {
            if (!data) return null;
            return CryptoJS.SHA256(String(data)).toString();
        } catch (error) {
            console.error('Hash Creation Error:', error);
            return null;
        }
    },

    // 메시지 암호화
    encryptMessage: (message, chatKey) => {
        try {
            const messageString = typeof message === 'object' ?
                JSON.stringify(message) : String(message);
            return CryptoJS.AES.encrypt(messageString, chatKey).toString();
        } catch (error) {
            console.error('Message Encryption Error:', error);
            return null;
        }
    },

    // 메시지 복호화
    decryptMessage: (encryptedMessage, chatKey) => {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedMessage, chatKey);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

            try {
                return JSON.parse(decryptedString);
            } catch {
                return decryptedString;
            }
        } catch (error) {
            console.error('Message Decryption Error:', error);
            return null;
        }
    },

    // 파일 암호화
    encryptFile: async (fileData) => {
        try {
            const wordArray = CryptoJS.lib.WordArray.create(fileData);
            return CryptoJS.AES.encrypt(wordArray, ENCRYPTION_KEY).toString();
        } catch (error) {
            console.error('File Encryption Error:', error);
            return null;
        }
    },

    // 파일 복호화
    decryptFile: async (encryptedFile) => {
        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedFile, ENCRYPTION_KEY);
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('File Decryption Error:', error);
            return null;
        }
    },

    // 채팅방 키 생성
    generateChatKey: (chatId, participants) => {
        try {
            const participantIds = participants
                .map(p => p.id)
                .sort()
                .join('-');
            return CryptoJS.SHA256(`${chatId}-${participantIds}`).toString();
        } catch (error) {
            console.error('Chat Key Generation Error:', error);
            return null;
        }
    },

    // 안전한 난수 생성
    generateSecureRandom: (length = 32) => {
        try {
            const wordArray = CryptoJS.lib.WordArray.random(length);
            return wordArray.toString();
        } catch (error) {
            console.error('Random Generation Error:', error);
            return null;
        }
    },

    // 데이터 무결성 검증
    verifyIntegrity: (data, hash) => {
        try {
            const calculatedHash = encryptionUtils.createHash(data);
            return calculatedHash === hash;
        } catch (error) {
            console.error('Integrity Verification Error:', error);
            return false;
        }
    },

    // 플랫폼별 보안 설정
    securityConfig: {
        keySize: Platform.select({
            ios: 256,
            android: 256,
            default: 128
        }),
        iterations: Platform.select({
            ios: 10000,
            android: 5000,
            default: 1000
        })
    }
};

export default encryptionUtils;