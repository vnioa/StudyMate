import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase 구성
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// FCM 토큰 가져오기
const getFCMToken = async () => {
    try {
        const currentToken = await getToken(messaging, {
            vapidKey: process.env.FIREBASE_VAPID_KEY
        });

        if (currentToken) {
            return currentToken;
        }

        throw new Error('FCM 토큰을 가져올 수 없습니다.');
    } catch (error) {
        console.error('FCM 토큰 에러:', error);
        return null;
    }
};

// 메시지 수신 핸들러
const onMessageListener = () => {
    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
};

// 스토리지 관련 유틸리티 함수
const storageUtils = {
    getDownloadURL: async (path) => {
        try {
            const reference = ref(storage, path);
            return await getDownloadURL(reference);
        } catch (error) {
            console.error('파일 다운로드 URL 가져오기 실패:', error);
            throw error;
        }
    },

    uploadFile: async (file, path) => {
        try {
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error('파일 업로드 실패:', error);
            throw error;
        }
    }
};

// 분석 이벤트 로깅
const logEvent = (eventName, params = {}) => {
    try {
        analytics.logEvent(eventName, params);
    } catch (error) {
        console.error('이벤트 로깅 실패:', error);
    }
};

export {
    app,
    messaging,
    storage,
    analytics,
    getFCMToken,
    onMessageListener,
    storageUtils,
    logEvent
};