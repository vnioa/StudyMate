const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin SDK 초기화
const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

// Firebase Admin SDK 초기화
const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// FCM 메시징 인스턴스 생성
const messaging = admin.messaging(app);

// FCM 알림 전송 함수
const sendPushNotification = async (token, title, body, data = {}) => {
    try {
        const message = {
            notification: {
                title,
                body
            },
            data,
            token
        };

        const response = await messaging.send(message);
        console.log('Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

// 다중 디바이스 알림 전송 함수
const sendMulticastPushNotification = async (tokens, title, body, data = {}) => {
    try {
        const message = {
            notification: {
                title,
                body
            },
            data,
            tokens
        };

        const response = await messaging.sendMulticast(message);
        console.log('Successfully sent multicast message:', response);
        return response;
    } catch (error) {
        console.error('Error sending multicast message:', error);
        throw error;
    }
};

module.exports = {
    app,
    messaging,
    sendPushNotification,
    sendMulticastPushNotification
};