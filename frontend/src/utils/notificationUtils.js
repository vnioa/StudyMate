// utils/notificationUtils.js

import * as Notifications from 'expo-notifications';

/**
 * Schedules a local notification.
 * @param {string} title - The notification title.
 * @param {string} body - The notification body.
 * @param {Date} date - The date and time to trigger the notification.
 * @returns {Promise<string>} The ID of the scheduled notification.
 */
export const scheduleNotification = async (title, body, date) => {
    return await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: { date: date.getTime() },
    });
};

/**
 * Cancels a scheduled notification.
 * @param {string} notificationId - The ID of the notification to cancel.
 * @returns {Promise<void>}
 */
export const cancelNotification = async (notificationId) => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
};

/**
 * Displays an immediate notification.
 * @param {string} title - The notification title.
 * @param {string} body - The notification body.
 * @returns {Promise<void>}
 */
export const showImmediateNotification = async (title, body) => {
    await Notifications.presentNotificationAsync({
        content: { title, body },
        trigger: null,
    });
};

// 로컬 알림 설정
export const showLocalNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
        },
        trigger: { seconds: 1 },
    });
};

// 파일 전송 완료 알림
export const showFileUploadNotification = async (fileName) => {
    await showLocalNotification('파일 전송 완료', `${fileName} 파일이 성공적으로 전송되었습니다.`);
};

// 메시지 수신 알림
export const showMessageNotification = async (message) => {
    await showLocalNotification('새 메시지 도착', message);
};