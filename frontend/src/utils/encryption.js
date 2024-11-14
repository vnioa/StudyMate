import CryptoJS from 'crypto-js';

export const encryptMessage = (message, key = 'default-key') => {
    return CryptoJS.AES.encrypt(message, key).toString();
};

export const decryptMessage = (encryptedMessage, key = 'default-key') => {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptFile = async (file, key = 'default-key') => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    return new Promise((resolve, reject) => {
        reader.onload = () => {
            const encryptedData = CryptoJS.AES.encrypt(reader.result, key).toString();
            resolve({ ...file, data: encryptedData });
        };
        reader.onerror = (error) => reject(error);
    });
};
