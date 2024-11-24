const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    eventId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['email', 'push', 'both'],
        default: 'push'
    },
    reminderTime: {
        type: Date,
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    sent: {
        type: Boolean,
        default: false
    },
    sentAt: Date,
    failureReason: String,
    retryCount: {
        type: Number,
        default: 0
    },
    settings: {
        repeatInterval: Number,
        repeatCount: Number,
        repeatEndDate: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 인덱스 생성
reminderSchema.index({ userId: 1, reminderTime: 1 });
reminderSchema.index({ eventId: 1, status: 1 });

// 업데이트 시 updatedAt 자동 갱신
reminderSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;