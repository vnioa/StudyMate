const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    friendId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: Date,
    blockedAt: Date,
    metadata: {
        lastInteraction: Date,
        commonGroups: [{
            groupId: String,
            joinedAt: Date
        }],
        notes: String
    },
    settings: {
        shareActivity: {
            type: Boolean,
            default: true
        },
        notifications: {
            type: Boolean,
            default: true
        }
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

// 복합 인덱스 생성
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });
friendSchema.index({ userId: 1, status: 1 });
friendSchema.index({ friendId: 1, status: 1 });

// 업데이트 시 updatedAt 자동 갱신
friendSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Friend = mongoose.model('Friend', friendSchema);

module.exports = Friend;