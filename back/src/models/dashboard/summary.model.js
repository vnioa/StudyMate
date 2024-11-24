const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    dailySummary: {
        totalStudyTime: {
            type: Number,
            default: 0
        },
        completedGoals: {
            type: Number,
            default: 0
        },
        sessions: [{
            subject: String,
            duration: Number,
            startTime: Date,
            endTime: Date,
            notes: String
        }]
    },
    weeklyStats: [{
        date: Date,
        studyTime: Number,
        sessionCount: Number,
        completedGoals: Number
    }],
    monthlyStats: [{
        month: Date,
        totalTime: Number,
        averageTimePerDay: Number,
        mostStudiedSubject: String
    }],
    upcomingEvents: [{
        title: String,
        description: String,
        startTime: Date,
        endTime: Date,
        type: {
            type: String,
            enum: ['study', 'quiz', 'meeting']
        }
    }],
    recentAchievements: [{
        type: String,
        title: String,
        earnedAt: Date,
        points: Number
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
summarySchema.index({ userId: 1, 'dailySummary.date': -1 });
summarySchema.index({ userId: 1, 'weeklyStats.date': -1 });

// 업데이트 시 updatedAt 자동 갱신
summarySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Summary = mongoose.model('Summary', summarySchema);

module.exports = Summary;