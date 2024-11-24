const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    groupId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    fileInfo: {
        path: String,
        originalName: String,
        mimeType: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    tags: [{
        type: String,
        index: true
    }],
    versions: [{
        version: Number,
        path: String,
        description: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        uploadedBy: String
    }],
    metadata: {
        views: {
            type: Number,
            default: 0
        },
        downloads: {
            type: Number,
            default: 0
        },
        lastViewed: Date
    },
    permissions: {
        canView: [{
            type: String  // userId
        }],
        canEdit: [{
            type: String  // userId
        }]
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
materialSchema.index({ title: 'text', description: 'text' });
materialSchema.index({ 'tags': 1 });
materialSchema.index({ status: 1 });

// 업데이트 시 updatedAt 자동 갱신
materialSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// 조회수 증가 메서드
materialSchema.methods.incrementViews = async function() {
    this.metadata.views += 1;
    this.metadata.lastViewed = new Date();
    return await this.save();
};

// 다운로드 수 증가 메서드
materialSchema.methods.incrementDownloads = async function() {
    this.metadata.downloads += 1;
    return await this.save();
};

// 새 버전 추가 메서드
materialSchema.methods.addVersion = async function(versionData) {
    this.versions.push({
        version: this.versions.length + 1,
        ...versionData
    });
    return await this.save();
};

const Material = mongoose.model('Material', materialSchema);

module.exports = Material;