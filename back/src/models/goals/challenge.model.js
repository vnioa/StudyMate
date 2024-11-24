const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    creatorId: {
        type: String,
        required: true,
        index: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    goalType: {
        type: String,
        enum: ['study_time', 'quiz_score', 'attendance'],
        required: true
    },
    targetValue: {
        type: Number,
        required: true
    },
    participants: [{
        userId: {
            type: String,
            required: true
        },
        progress: {
            type: Number,
            default: 0
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }],
    rewards: {
        points: Number,
        badge: String,
        specialPrivilege: String
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    rules: [{
        type: String
    }],
    leaderboard: [{
        userId: String,
        score: Number,
        rank: Number,
        updatedAt: Date
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
challengeSchema.index({ creatorId: 1, status: 1 });
challengeSchema.index({ startDate: 1, endDate: 1 });
challengeSchema.index({ 'participants.userId': 1 });

// 업데이트 시 updatedAt 자동 갱신
challengeSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;