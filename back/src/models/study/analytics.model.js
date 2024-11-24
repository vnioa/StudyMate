const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    studyStats: {
        totalTime: {
            type: Number,
            default: 0
        },
        dailyAverage: {
            type: Number,
            default: 0
        },
        subjectDistribution: [{
            subject: String,
            time: Number,
            percentage: Number
        }]
    },
    performanceMetrics: {
        quizScores: [{
            quizId: String,
            score: Number,
            date: Date
        }],
        averageScore: {
            type: Number,
            default: 0
        },
        improvement: {
            type: Number,
            default: 0
        }
    },
    activityPatterns: {
        peakHours: [{
            hour: Number,
            frequency: Number
        }],
        weekdayDistribution: [{
            day: String,
            studyTime: Number
        }],
        consistencyScore: {
            type: Number,
            default: 0
        }
    },
    goals: {
        completed: {
            type: Number,
            default: 0
        },
        inProgress: {
            type: Number,
            default: 0
        },
        achievementRate: {
            type: Number,
            default: 0
        }
    },
    comparativeStats: {
        rankInGroup: Number,
        percentile: Number,
        relativeProgress: Number
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
analyticsSchema.index({ userId: 1 });
analyticsSchema.index({ 'studyStats.totalTime': -1 });
analyticsSchema.index({ 'performanceMetrics.averageScore': -1 });

// 업데이트 시 updatedAt 자동 갱신
analyticsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;