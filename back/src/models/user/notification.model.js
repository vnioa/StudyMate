const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    pushEnabled: {
        type: Boolean,
        default: true
    },
    emailEnabled: {
        type: Boolean,
        default: true
    },
    priorityLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    notificationTime: {
        startTime: {
            type: String,
            default: '09:00'
        },
        endTime: {
            type: String,
            default: '22:00'
        }
    },
    notificationMethods: [{
        type: String,
        enum: ['push', 'email', 'inApp'],
        default: ['push', 'inApp']
    }],
    studyAlerts: {
        goalAchievement: {
            type: Boolean,
            default: true
        },
        quizReminder: {
            type: Boolean,
            default: true
        },
        studySession: {
            type: Boolean,
            default: true
        },
        groupActivity: {
            type: Boolean,
            default: true
        }
    },
    deviceTokens: [{
        token: String,
        device: String,
        lastUsed: Date
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 인덱스 생성
notificationSettingsSchema.index({ userId: 1 });
notificationSettingsSchema.index({ 'deviceTokens.token': 1 });

// 알림 시간대 내 여부 확인 메서드
notificationSettingsSchema.methods.isWithinNotificationHours = function() {
    const now = new Date();
    const currentTime = now.getHours() + ':' + now.getMinutes();
    return currentTime >= this.notificationTime.startTime &&
        currentTime <= this.notificationTime.endTime;
};

// 디바이스 토큰 추가/업데이트 메서드
notificationSettingsSchema.methods.updateDeviceToken = async function(token, device) {
    const existingToken = this.deviceTokens.find(t => t.token === token);
    if (existingToken) {
        existingToken.lastUsed = new Date();
    } else {
        this.deviceTokens.push({
            token,
            device,
            lastUsed: new Date()
        });
    }
    return await this.save();
};

// 오래된 디바이스 토큰 제거 메서드
notificationSettingsSchema.methods.removeOldTokens = async function(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.deviceTokens = this.deviceTokens.filter(token =>
        token.lastUsed > cutoffDate
    );

    return await this.save();
};

const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);

module.exports = NotificationSettings;