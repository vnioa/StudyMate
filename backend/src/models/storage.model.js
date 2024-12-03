const { DataTypes } = require('sequelize');

// 상수 정의
const STORAGE_TYPES = {
    DEVICE: 'device',
    CLOUD: 'cloud'
};

const SYNC_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

const SYNC_TYPES = {
    MANUAL: 'manual',
    AUTO: 'auto',
    SCHEDULED: 'scheduled'
};

const STORAGE_ACTIONS = {
    ADD: 'add',
    DELETE: 'delete',
    MODIFY: 'modify'
};

module.exports = (sequelize) => {
    // StorageSettings 모델 정의
    const StorageSettings = sequelize.define('StorageSettings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '저장소 설정 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '회원번호'
        },
        storageType: {
            type: DataTypes.ENUM(Object.values(STORAGE_TYPES)),
            defaultValue: STORAGE_TYPES.DEVICE,
            comment: '저장소 유형'
        },
        cloudStorageUsed: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
            validate: {
                min: 0
            },
            comment: '사용 중인 클라우드 저장소 용량(bytes)'
        },
        deviceStorageUsed: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
            validate: {
                min: 0
            },
            comment: '사용 중인 디바이스 저장소 용량(bytes)'
        },
        lastSyncAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '마지막 동기화 시간'
        },
        autoSync: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '자동 동기화 여부'
        },
        syncInterval: {
            type: DataTypes.INTEGER,
            defaultValue: 24,
            validate: {
                min: 1,
                max: 168
            },
            comment: '동기화 주기(시간)'
        },
        maxCloudStorage: {
            type: DataTypes.BIGINT,
            defaultValue: 5368709120,
            comment: '최대 클라우드 저장소 용량(bytes)'
        },
        maxDeviceStorage: {
            type: DataTypes.BIGINT,
            defaultValue: 1073741824,
            comment: '최대 디바이스 저장소 용량(bytes)'
        }
    }, {
        tableName: 'storage_settings',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['storageType'] }
        ]
    });

    // StorageSync 모델 정의
    const StorageSync = sequelize.define('StorageSync', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '동기화 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '회원번호'
        },
        status: {
            type: DataTypes.ENUM(Object.values(SYNC_STATUS)),
            defaultValue: SYNC_STATUS.PENDING,
            comment: '동기화 상태'
        },
        startedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '동기화 시작 시간'
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '동기화 완료 시간'
        },
        dataTransferred: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
            validate: {
                min: 0
            },
            comment: '전송된 데이터 크기(bytes)'
        },
        error: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '오류 메시지'
        },
        retryCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 3
            },
            comment: '재시도 횟수'
        },
        syncType: {
            type: DataTypes.ENUM(Object.values(SYNC_TYPES)),
            defaultValue: SYNC_TYPES.MANUAL,
            comment: '동기화 유형'
        }
    }, {
        tableName: 'storage_syncs',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['status', 'startedAt'] }
        ]
    });

    // StorageUsageLog 모델 정의
    const StorageUsageLog = sequelize.define('StorageUsageLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '사용 로그 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '회원번호'
        },
        storageType: {
            type: DataTypes.ENUM(Object.values(STORAGE_TYPES)),
            allowNull: false,
            comment: '저장소 유형'
        },
        action: {
            type: DataTypes.ENUM(Object.values(STORAGE_ACTIONS)),
            allowNull: false,
            comment: '수행된 작업'
        },
        sizeChange: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: '변경된 저장소 크기(bytes)'
        },
        details: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidDetails(value) {
                    if (value && typeof value !== 'object') {
                        throw new Error('상세 정보는 객체 형태여야 합니다.');
                    }
                }
            },
            comment: '상세 정보'
        },
        fileName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: '파일명'
        },
        fileType: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '파일 유형'
        },
        filePath: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: '파일 경로'
        }
    }, {
        tableName: 'storage_usage_logs',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['storageType', 'action'] },
            { fields: ['createdAt'] }
        ]
    });

    // 모델 간 관계 설정은 동일하게 유지
    StorageSettings.associate = (models) => {
        StorageSettings.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    StorageSync.associate = (models) => {
        StorageSync.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    StorageUsageLog.associate = (models) => {
        StorageUsageLog.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    return {
        StorageSettings,
        StorageSync,
        StorageUsageLog,
        STORAGE_TYPES,
        SYNC_STATUS,
        SYNC_TYPES,
        STORAGE_ACTIONS
    };
};