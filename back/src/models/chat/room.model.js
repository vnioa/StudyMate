const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['direct', 'group'],
        required: true
    },
    creatorId: {
        type: String,
        required: true,
        index: true
    },
    participants: [{
        userId: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        lastRead: Date
    }],
    settings: {
        notification: {
            type: Boolean,
            default: true
        },
        theme: {
            type: String,
            default: 'default'
        },
        encryption: {
            type: Boolean,
            default: false
        }
    },
    lastMessage: {
        content: String,
        senderId: String,
        type: String,
        sentAt: Date
    },
    metadata: {
        messageCount: {
            type: Number,
            default: 0
        },
        unreadCount: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted'],
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
roomSchema.index({ creatorId: 1, type: 1 });
roomSchema.index({ 'participants.userId': 1 });
roomSchema.index({ status: 1 });

// 업데이트 시 updatedAt 자동 갱신
roomSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;