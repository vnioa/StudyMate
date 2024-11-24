const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
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
    category: {
        type: String,
        required: true,
        index: true
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    maxMembers: {
        type: Number,
        default: 50
    },
    members: [{
        userId: String,
        role: {
            type: String,
            enum: ['admin', 'manager', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    settings: {
        rules: [String],
        joinApproval: {
            type: Boolean,
            default: true
        },
        memberPermissions: {
            uploadFiles: Boolean,
            createQuizzes: Boolean,
            scheduleEvents: Boolean
        }
    },
    media: {
        icon: String,
        banner: String
    },
    stats: {
        memberCount: {
            type: Number,
            default: 0
        },
        studyHours: {
            type: Number,
            default: 0
        },
        quizCount: {
            type: Number,
            default: 0
        },
        materialCount: {
            type: Number,
            default: 0
        }
    },
    goals: [{
        title: String,
        description: String,
        targetDate: Date,
        progress: {
            type: Number,
            default: 0
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
groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ category: 1, isPublic: 1 });

// 업데이트 시 updatedAt 자동 갱신
groupSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;