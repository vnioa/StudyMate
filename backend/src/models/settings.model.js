const { DataTypes } = require('sequelize');

// 상수 정의
const DISPLAY_MODES = {
    LIGHT: 'light',
    DARK: 'dark'
};

const THEME_TYPES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

const BACKUP_INTERVALS = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly'
};

module.exports = (sequelize) => {
    // Settings 모델 정의
    const Settings = sequelize.define('Settings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '설정 ID'
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
        displayMode: {
            type: DataTypes.ENUM(Object.values(DISPLAY_MODES)),
            defaultValue: DISPLAY_MODES.LIGHT,
            comment: '화면 모드'
        },
        autoDisplayMode: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '자동 화면 모드 여부'
        },
        displayScheduleStart: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: '화면 모드 시작 시간'
        },
        displayScheduleEnd: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: '화면 모드 종료 시간'
        },
        fontSize: {
            type: DataTypes.INTEGER,
            defaultValue: 16,
            validate: {
                min: 8,
                max: 32
            },
            comment: '글자 크기'
        },
        fontPreviewText: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: '글꼴 미리보기 텍스트'
        },
        theme: {
            type: DataTypes.ENUM(Object.values(THEME_TYPES)),
            defaultValue: THEME_TYPES.SYSTEM,
            comment: '테마'
        },
        language: {
            type: DataTypes.STRING(10),
            defaultValue: 'ko',
            comment: '언어 설정'
        }
    }, {
        tableName: 'settings',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'], unique: true }
        ]
    });

    // BackupSettings 모델 정의
    const BackupSettings = sequelize.define('BackupSettings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '백업 설정 ID'
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
        autoBackup: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '자동 백업 활성화'
        },
        backupInterval: {
            type: DataTypes.ENUM(Object.values(BACKUP_INTERVALS)),
            defaultValue: BACKUP_INTERVALS.DAILY,
            comment: '백업 주기'
        },
        lastBackupDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '마지막 백업 날짜'
        },
        backupLocation: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: '백업 저장 위치'
        },
        backupSize: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
            validate: {
                min: 0
            },
            comment: '백업 크기(bytes)'
        },
        maxBackupSize: {
            type: DataTypes.BIGINT,
            defaultValue: 1073741824, // 1GB
            comment: '최대 백업 크기(bytes)'
        },
        retentionPeriod: {
            type: DataTypes.INTEGER,
            defaultValue: 30,
            comment: '백업 보관 기간(일)'
        }
    }, {
        tableName: 'backup_settings',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'], unique: true }
        ]
    });

    // TimeSettings 모델 정의
    const TimeSettings = sequelize.define('TimeSettings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '시간 설정 ID'
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
        title: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 100]
            },
            comment: '설정 제목'
        },
        startTime: {
            type: DataTypes.TIME,
            allowNull: false,
            comment: '시작 시간'
        },
        endTime: {
            type: DataTypes.TIME,
            allowNull: false,
            comment: '종료 시간'
        },
        enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '활성화 여부'
        },
        days: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            validate: {
                isValidDays(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('days must be an array');
                    }
                    const validDays = [0,1,2,3,4,5,6];
                    if (!value.every(day => validDays.includes(day))) {
                        throw new Error('Invalid day value');
                    }
                }
            },
            comment: '요일 설정'
        }
    }, {
        tableName: 'time_settings',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId', 'title'], unique: true },
            { fields: ['memberId'] }
        ]
    });

    // 모델 간 관계 설정은 동일하게 유지
    Settings.associate = (models) => {
        Settings.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    BackupSettings.associate = (models) => {
        BackupSettings.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    TimeSettings.associate = (models) => {
        TimeSettings.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    return {
        Settings,
        BackupSettings,
        TimeSettings,
        DISPLAY_MODES,
        THEME_TYPES,
        BACKUP_INTERVALS
    };
};