const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    groupId: {
        type: String,
        required: true,
        index: true
    },
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
achievementSchema.index({ groupId: 1, userId: 1 });
achievementSchema.index({ 'achievements.type': 1 });

// 업적 달성 확인 메서드
achievementSchema.methods.checkAchievement = function(type, value) {
    const achievement = this.achievements.find(a =>
        a.type === type && !a.achieved && value >= a.progress.target
    );

    if (achievement) {
        achievement.achieved = true;
        achievement.achievedAt = new Date();
        this.stats.totalPoints += achievement.points;
        return achievement;
    }
    return null;
};

// 레벨 업데이트 메서드
achievementSchema.methods.updateLevel = function() {
    const newLevel = Math.floor(this.stats.totalPoints / 1000) + 1;
    if (newLevel > this.stats.level) {
        this.stats.level = newLevel;
        return true;
    }
    return false;
};

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;