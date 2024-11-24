const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    startTime: {
        type: Date,
        required: true,
        index: true
    },
    endTime: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['study', 'meeting', 'quiz', 'event'],
        required: true
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringPattern: {
        type: {
            type: String,
            enum: ['daily', 'weekly', 'monthly']
        },
        interval: Number,
        endDate: Date
    },
    location: {
        type: {
            type: String,
            enum: ['online', 'offline'],
            default: 'online'
        },
        detail: String,
        link: String
    },
    reminders: [{
        time: Date,
        type: {
            type: String,
            enum: ['email', 'push', 'both'],
            default: 'push'
        },
        sent: {
            type: Boolean,
            default: false
        }
    }],
    participants: [{
        userId: String,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending'
        },
        responseTime: Date
    }],
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
calendarSchema.index({ userId: 1, startTime: 1 });
calendarSchema.index({ 'participants.userId': 1 });

// 업데이트 시 updatedAt 자동 갱신
calendarSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Calendar = mongoose.model('Calendar', calendarSchema);

module.exports = Calendar;