const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true
    },
    studyType: {
        type: String,
        enum: ['self_study', 'group_study', 'lecture', 'practice'],
        required: true
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    pomodoroSettings: {
        duration: Number,
        breakTime: Number,
        completedCycles: {
            type: Number,
            default: 0
        }
    },
    goals: [{
        title: String,
        completed: {
            type: Boolean,
            default: false
        }
    }],
    metrics: {
        focusScore: {
            type: Number,
            min: 0,
            max: 100
        },
        breakCount: {
            type: Number,
            default: 0
        },
        productivity: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed'],
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
sessionSchema.index({ userId: 1, startTime: -1 });
sessionSchema.index({ subject: 1 });
sessionSchema.index({ status: 1 });

// 업데이트 시 updatedAt 자동 갱신
sessionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;