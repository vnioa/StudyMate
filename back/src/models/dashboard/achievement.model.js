const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    achievements: [{
        type: {
            type: String,
            enum: ['study_time', 'quiz_score', 'participation', 'contribution'],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: String,
        level: {
            type: Number,
            default: 1
        },
        progress: {
            current: Number,
            target: Number
        },
        achieved: {
            type: Boolean,
            default: false
        },
        achievedAt: Date,
        points: {
            type: Number,
            default: 0
        }
    }],
    badges: [{
        name: String,
        description: String,
        imageUrl: String,
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],
    stats: {
        totalPoints: {
            type: Number,
            default: 0
        },
        level: {
            type: Number,
            default: 1
        },
        studyTime: {
            type: Number,
            default: 0
        },
        quizzesTaken: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        }
    },
    rewards: [{
        type: {
            type: String,
            enum: ['virtual_currency', 'privilege', 'badge'],
            required: true
        },
        name: String,
        value: Number,
        earnedAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: Date
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 인덱스 생성
achievementSchema.index({ userId: 1 });
achievementSchema.index({ 'achievements.type': 1 });

// 업데이트 시 updatedAt 자동 갱신
achievementSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;