const { DataTypes } = require('sequelize');

// 상수 정의
const BACKUP_TYPES = {
    FULL: 'full',
    INCREMENTAL: 'incremental',
    DIFFERENTIAL: 'differential'
};

const COMPRESSION_TYPES = {
    ZIP: 'zip',
    TAR: 'tar',
    GZIP: 'gzip'
};

const BACKUP_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

const HISTORY_ACTIONS = {
    CREATE: 'create',
    RESTORE: 'restore',
    DELETE: 'delete'
};

const HISTORY_STATUS = {
    SUCCESS: 'success',
    FAILURE: 'failure'
};

module.exports = (sequelize) => {
    // Backup 모델 정의
    const Backup = sequelize.define('Backup', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '백업 ID'
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '백업 날짜'
        },
        type: {
            type: DataTypes.ENUM(Object.values(BACKUP_TYPES)),
            allowNull: false,
            defaultValue: BACKUP_TYPES.FULL,
            comment: '백업 유형'
        },
        compressionType: {
            type: DataTypes.ENUM(Object.values(COMPRESSION_TYPES)),
            allowNull: false,
            defaultValue: COMPRESSION_TYPES.ZIP,
            comment: '압축 유형'
        },
        size: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: '백업 크기(bytes)'
        },
        status: {
            type: DataTypes.ENUM(Object.values(BACKUP_STATUS)),
            defaultValue: BACKUP_STATUS.PENDING,
            comment: '백업 상태'
        },
        progress: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 100
            },
            comment: '진행률'
        },
        filePath: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: '백업 파일 경로'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '백업 설명'
        }
    }, {
        tableName: 'backups',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['date'] },
            { fields: ['status'] },
            { fields: ['type'] }
        ]
    });

    // BackupSettings 모델 정의
    const BackupSettings = sequelize.define('BackupSettings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '설정 ID'
        },
        isAutoBackup: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '자동 백업 활성화 여부'
        },
        backupInterval: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'daily',
            comment: '백업 주기'
        },
        lastBackupDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '마지막 백업 날짜'
        },
        retentionPeriod: {
            type: DataTypes.INTEGER,
            defaultValue: 30,
            comment: '백업 보관 기간(일)'
        },
        maxBackupSize: {
            type: DataTypes.BIGINT,
            defaultValue: 1073741824,
            comment: '최대 백업 크기(bytes)'
        },
        backupType: {
            type: DataTypes.ENUM(Object.values(BACKUP_TYPES)),
            defaultValue: BACKUP_TYPES.FULL,
            comment: '백업 유형'
        },
        compressionEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '압축 활성화 여부'
        },
        backupPath: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: './backups',
            comment: '백업 저장 경로'
        }
    }, {
        tableName: 'backup_settings',
        timestamps: true,
        paranoid: true
    });

    // BackupHistory 모델 정의
    const BackupHistory = sequelize.define('BackupHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '히스토리 ID'
        },
        backupId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'backups',
                key: 'id'
            },
            comment: '백업 ID'
        },
        action: {
            type: DataTypes.ENUM(Object.values(HISTORY_ACTIONS)),
            allowNull: false,
            comment: '수행된 작업'
        },
        status: {
            type: DataTypes.ENUM(Object.values(HISTORY_STATUS)),
            allowNull: false,
            comment: '작업 상태'
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '오류 메시지'
        },
        performedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '수행자 회원번호'
        }
    }, {
        tableName: 'backup_history',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['backupId'] },
            { fields: ['performedBy'] },
            { fields: ['createdAt', 'status'] }
        ]
    });

    // 모델 간 관계 설정
    Backup.associate = (models) => {
        Backup.hasMany(BackupHistory, {
            foreignKey: 'backupId',
            as: 'history',
            onDelete: 'CASCADE'
        });
    };

    BackupHistory.associate = (models) => {
        BackupHistory.belongsTo(Backup, {
            foreignKey: 'backupId',
            as: 'backup'
        });

        BackupHistory.belongsTo(models.Auth, {
            foreignKey: 'performedBy',
            as: 'performer'
        });
    };

    return {
        Backup,
        BackupSettings,
        BackupHistory,
        BACKUP_TYPES,
        COMPRESSION_TYPES,
        BACKUP_STATUS,
        HISTORY_ACTIONS,
        HISTORY_STATUS
    };
};