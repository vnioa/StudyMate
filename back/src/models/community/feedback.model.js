const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    groupId: {
        type: String,
        required: true,
        index: true
    },
    fromUserId: {
        type: String,
        required: true,
        index: true
    },
    toUserId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['peer', 'self', 'mentor'],
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    feedback: {
        type: String,
        required: true
    },
    suggestions: {
        type: String
    },
    studySessionId: {
        type: String,
        index: true
    },
    strengths: [{
        type: String
    }],
    weaknesses: [{
        type: String
    }],
    improvements: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['draft', 'submitted', 'reviewed'],
        default: 'submitted'
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
feedbackSchema.index({ fromUserId: 1, toUserId: 1, createdAt: -1 });
feedbackSchema.index({ groupId: 1, type: 1 });

// 업데이트 시 updatedAt 자동 갱신
feedbackSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;