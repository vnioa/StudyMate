const admin = require('firebase-admin');
const config = require('../config/database.config');

// Firebase Admin SDK 초기화
const initializeFirebaseAdmin = () => {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: config.firebase.firebaseConfig.projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            }),
            storageBucket: config.firebase.firebaseConfig.storageBucket
        });
        console.log('Firebase Admin SDK 초기화 성공');
        return admin;
    } catch (error) {
        console.error('Firebase Admin SDK 초기화 실패:', error);
        throw error;
    }
};

// FCM 메시지 전송
const sendFCMMessage = async (token, title, body, data = {}) => {
    try {
        const message = {
            notification: {
                title,
                body
            },
            data,
            token
        };

        const response = await admin.messaging().send(message);
        return response;
    } catch (error) {
        console.error('FCM 메시지 전송 실패:', error);
        throw error;
    }
};

// 파일 업로드
const uploadFile = async (file, path) => {
    try {
        const bucket = admin.storage().bucket();
        const fileUpload = bucket.file(path);

        await fileUpload.save(file.buffer, {
            contentType: file.mimetype
        });

        const [url] = await fileUpload.getSignedUrl({
            action: 'read',
            expires: '03-01-2500'
        });

        return url;
    } catch (error) {
        console.error('파일 업로드 실패:', error);
        throw error;
    }
};

// 파일 다운로드 URL 가져오기
const getFileDownloadURL = async (path) => {
    try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(path);

        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500'
        });

        return url;
    } catch (error) {
        console.error('파일 다운로드 URL 가져오기 실패:', error);
        throw error;
    }
};

// 파일 삭제
const deleteFile = async (path) => {
    try {
        const bucket = admin.storage().bucket();
        await bucket.file(path).delete();
    } catch (error) {
        console.error('파일 삭제 실패:', error);
        throw error;
    }
};

module.exports = {
    initializeFirebaseAdmin,
    sendFCMMessage,
    uploadFile,
    getFileDownloadURL,
    deleteFile
};