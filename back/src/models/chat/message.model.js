const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'system'],
        default: 'text'
    },
    metadata: {
        fileId: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
        imageUrl: String,
        thumbnailUrl: String
    },
    replyTo: {
        messageId: String,
        content: String
    },
    readBy: [{
        userId: String,
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    reactions: [{
        userId: String,
        type: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent'
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editHistory: [{
        content: String,
        editedAt: Date
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
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ userId: 1, type: 1 });

// 업데이트 시 updatedAt 자동 갱신
messageSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;