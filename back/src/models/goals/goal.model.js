const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ['short_term', 'mid_term', 'long_term'],
        required: true
    },
    targetDate: {
        type: Date,
        required: true
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    milestones: [{
        title: String,
        targetDate: Date,
        completed: {
            type: Boolean,
            default: false
        }
    }],
    metrics: {
        studyTime: {
            target: Number,
            current: {
                type: Number,
                default: 0
            }
        },
        taskCompletion: {
            target: Number,
            current: {
                type: Number,
                default: 0
            }
        }
    },
    reminders: [{
        date: Date,
        message: String,
        sent: {
            type: Boolean,
            default: false
        }
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
goalSchema.index({ userId: 1, type: 1 });
goalSchema.index({ status: 1 });
goalSchema.index({ targetDate: 1 });

// 업데이트 시 updatedAt 자동 갱신
goalSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;