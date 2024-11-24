const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    streakCount: {
        type: Number,
        default: 0
    },
    lastStudyDate: {
        type: Date,
        required: true
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    freezeCount: {
        type: Number,
        default: 3
    },
    history: [{
        date: {
            type: Date,
            required: true
        },
        studyTime: {
            type: Number,
            default: 0
        },
        completed: {
            type: Boolean,
            default: true
        }
    }],
    milestones: [{
        streakCount: Number,
        achievedAt: Date,
        reward: {
            type: String,
            points: Number
        }
    }],
    status: {
        type: String,
        enum: ['active', 'broken', 'frozen'],
        default: 'active'
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
streakSchema.index({ userId: 1, lastStudyDate: -1 });
streakSchema.index({ status: 1 });

// 업데이트 시 updatedAt 자동 갱신
streakSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Streak = mongoose.model('Streak', streakSchema);

module.exports = Streak;