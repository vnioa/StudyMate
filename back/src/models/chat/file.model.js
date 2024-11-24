const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
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
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    metadata: {
        width: Number,
        height: Number,
        duration: Number,
        thumbnail: String
    },
    status: {
        type: String,
        enum: ['uploading', 'completed', 'failed'],
        default: 'uploading'
    },
    downloads: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date
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
fileSchema.index({ roomId: 1, createdAt: -1 });
fileSchema.index({ userId: 1, fileType: 1 });

// 업데이트 시 updatedAt 자동 갱신
fileSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const File = mongoose.model('File', fileSchema);

module.exports = File;