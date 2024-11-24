const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    theme: {
        mode: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        },
        language: {
            type: String,
            default: 'ko'
        },
        fontFamily: {
            type: String,
            default: 'system-default'
        }
    },
    privacy: {
        dataStorage: {
            type: String,
            enum: ['local', 'cloud'],
            default: 'cloud'
        },
        backupEnabled: {
            type: Boolean,
            default: true
        },
        syncEnabled: {
            type: Boolean,
            default: true
        }
    },
    accessibility: {
        highContrast: {
            type: Boolean,
            default: false
        },
        fontSize: {
            type: String,
            enum: ['small', 'medium', 'large', 'extra-large'],
            default: 'medium'
        },
        keyboardShortcuts: {
            type: Boolean,
            default: true
        }
    },
    deviceSync: {
        devices: [{
            deviceId: String,
            deviceName: String,
            lastSync: Date
        }],
        autoSync: {
            type: Boolean,
            default: true
        },
        syncInterval: {
            type: Number,
            default: 30 // minutes
        }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 인덱스 생성
settingsSchema.index({ userId: 1 });
settingsSchema.index({ 'deviceSync.devices.deviceId': 1 });

// 설정 업데이트 시 updatedAt 자동 갱신
settingsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// 디바이스 추가/업데이트 메서드
settingsSchema.methods.updateDevice = async function(deviceId, deviceName) {
    const existingDevice = this.deviceSync.devices.find(
        device => device.deviceId === deviceId
    );

    if (existingDevice) {
        existingDevice.deviceName = deviceName;
        existingDevice.lastSync = new Date();
    } else {
        this.deviceSync.devices.push({
            deviceId,
            deviceName,
            lastSync: new Date()
        });
    }

    return await this.save();
};

// 디바이스 삭제 메서드
settingsSchema.methods.removeDevice = async function(deviceId) {
    this.deviceSync.devices = this.deviceSync.devices.filter(
        device => device.deviceId !== deviceId
    );
    return await this.save();
};

// 설정 초기화 메서드
settingsSchema.methods.resetToDefault = async function() {
    this.theme = {
        mode: 'system',
        language: 'ko',
        fontFamily: 'system-default'
    };
    this.privacy = {
        dataStorage: 'cloud',
        backupEnabled: true,
        syncEnabled: true
    };
    this.accessibility = {
        highContrast: false,
        fontSize: 'medium',
        keyboardShortcuts: true
    };
    this.deviceSync = {
        devices: [],
        autoSync: true,
        syncInterval: 30
    };

    return await this.save();
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;