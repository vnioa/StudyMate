const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
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
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    },
    message: {
        type: String,
        trim: true
    },
    metadata: {
        commonFriends: [{
            userId: String,
            name: String
        }],
        mutualGroups: [{
            groupId: String,
            name: String
        }]
    },
    expiresAt: {
        type: Date
    },
    respondedAt: Date,
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
requestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
requestSchema.index({ status: 1, createdAt: -1 });

// 업데이트 시 updatedAt 자동 갱신
requestSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;