const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    backupPath: {
        type: String,
        required: true
    },
    backupType: {
        type: String,
        enum: ['FULL', 'PARTIAL'],
        default: 'FULL'
    },
    dataTypes: [{
        type: String,
        enum: ['PROFILE', 'SETTINGS', 'STUDY_DATA', 'CHAT_HISTORY']
    }],
    size: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    description: {
        type: String
    },
    metadata: {
        deviceInfo: String,
        appVersion: String,
        platform: String
    },
    isAutoBackup: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date
    }
});

// 인덱스 생성
backupSchema.index({ userId: 1, createdAt: -1 });
backupSchema.index({ status: 1 });

// 가상 필드: 백업 경과 시간
backupSchema.virtual('elapsedTime').get(function() {
    return Date.now() - this.createdAt;
});

// 백업 만료 여부 확인 메서드
backupSchema.methods.isExpired = function() {
    if (!this.expiresAt) return false;
    return Date.now() > this.expiresAt;
};

// 백업 상태 업데이트 메서드
backupSchema.methods.updateStatus = async function(status) {
    this.status = status;
    return await this.save();
};

// 정적 메서드: 사용자의 최근 백업 조회
backupSchema.statics.findLatestBackup = async function(userId) {
    return await this.findOne({ userId })
        .sort({ createdAt: -1 })
        .exec();
};

// 정적 메서드: 만료된 백업 삭제
backupSchema.statics.deleteExpiredBackups = async function() {
    const now = new Date();
    return await this.deleteMany({
        expiresAt: { $lt: now }
    });
};

const Backup = mongoose.model('Backup', backupSchema);

module.exports = Backup;