const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Backup 모델 정의
    const Backup = sequelize.define('Backup', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        type: {
            type: DataTypes.ENUM('full', 'incremental', 'differential'),
            allowNull: false,
            defaultValue: 'full'
        },
        compressionType: {
            type: DataTypes.ENUM('zip', 'tar', 'gzip'),
            allowNull: false,
            defaultValue: 'zip',
        },
        size: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed'),
            defaultValue: 'pending'
        },
        progress: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 100
            }
        },
        filePath: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'backups',
        timestamps: true,
        indexes: [
            {
                fields: ['date']
            },
            {
                fields: ['status']
            }
        ]
    });

    // BackupSettings 모델 정의
    const BackupSettings = sequelize.define('BackupSettings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        isAutoBackup: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        backupInterval: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'daily'
        },
        lastBackupDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        retentionPeriod: {
            type: DataTypes.INTEGER,
            defaultValue: 30,
            comment: '백업 보관 기간(일)'
        },
        maxBackupSize: {
            type: DataTypes.BIGINT,
            defaultValue: 1073741824, // 1GB in bytes
            comment: '최대 백업 크기(bytes)'
        },
        backupType: {
            type: DataTypes.ENUM('full', 'incremental'),
            defaultValue: 'full'
        },
        compressionEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        backupPath: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: './backups'
        }
    }, {
        tableName: 'backup_settings',
        timestamps: true
    });

    // BackupHistory 모델 정의
    const BackupHistory = sequelize.define('BackupHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        backupId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'backups',
                key: 'id'
            }
        },
        action: {
            type: DataTypes.ENUM('create', 'restore', 'delete'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('success', 'failure'),
            allowNull: false
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        performedBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'backup_history',
        timestamps: true,
        indexes: [
            {
                fields: ['backupId']
            },
            {
                fields: ['performedBy']
            },
            {
                fields: ['date', 'status']
            },
            {
                fields: ['size']
            }
        ]
    });

    // 모델 간 관계 설정
    Backup.associate = (models) => {
        Backup.hasMany(models.backupHistory, {
            foreignKey: 'backupId',
            as: 'history',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
    }

    BackupHistory.associate = (models) => {
        BackupHistory.belongsTo(models.Backup, {
            foreignKey: 'backupId',
            as: 'backup'
        });

        BackupHistory.belongsTo(models.User, {
            foreignKey: 'performedBy',
            as: 'user'
        });
    };

    return {
        Backup,
        BackupSettings,
        BackupHistory
    };
};