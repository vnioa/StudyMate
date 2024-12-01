const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // StorageSettings 모델 정의
    const StorageSettings = sequelize.define('StorageSettings', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        storageType: {
            type: DataTypes.ENUM('device', 'cloud'),
            defaultValue: 'device'
        },
        cloudStorageUsed: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
            comment: '사용 중인 클라우드 저장소 용량(bytes)'
        },
        deviceStorageUsed: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
            comment: '사용 중인 디바이스 저장소 용량(bytes)'
        },
        lastSyncAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        autoSync: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        syncInterval: {
            type: DataTypes.INTEGER,
            defaultValue: 24,
            comment: '동기화 주기(시간)'
        }
    }, {
        tableName: 'storage_settings',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['storageType']
            }
        ]
    });

    // StorageSync 모델 정의
    const StorageSync = sequelize.define('StorageSync', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed'),
            defaultValue: 'pending'
        },
        startedAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        dataTransferred: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
            comment: '전송된 데이터 크기(bytes)'
        },
        error: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'storage_syncs',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['status']
            }
        ]
    });

    // StorageUsageLog 모델 정의
    const StorageUsageLog = sequelize.define('StorageUsageLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        storageType: {
            type: DataTypes.ENUM('device', 'cloud'),
            allowNull: false
        },
        action: {
            type: DataTypes.ENUM('add', 'delete', 'modify'),
            allowNull: false
        },
        sizeChange: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: '변경된 저장소 크기(bytes)'
        },
        details: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        tableName: 'storage_usage_logs',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['storageType']
            }
        ]
    });

    // 모델 간 관계 설정
    StorageSettings.associate = (models) => {
        StorageSettings.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    StorageSync.associate = (models) => {
        StorageSync.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    StorageUsageLog.associate = (models) => {
        StorageUsageLog.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return {
        StorageSettings,
        StorageSync,
        StorageUsageLog
    };
};