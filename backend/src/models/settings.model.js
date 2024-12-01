const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Settings 모델 정의
    const Settings = sequelize.define('Settings', {
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
        displayMode: {
            type: DataTypes.ENUM('light', 'dark'),
            defaultValue: 'light'
        },
        autoDisplayMode: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        displayScheduleStart: {
            type: DataTypes.TIME,
            allowNull: true
        },
        displayScheduleEnd: {
            type: DataTypes.TIME,
            allowNull: true
        },
        fontSize: {
            type: DataTypes.INTEGER,
            defaultValue: 16
        },
        fontPreviewText: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        theme: {
            type: DataTypes.ENUM('light', 'dark', 'system'),
            defaultValue: 'system'
        }
    }, {
        tableName: 'settings',
        timestamps: true
    });

    // NotificationSettings 모델 정의
    const NotificationSettings = sequelize.define('NotificationSettings', {
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
        pushEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        emailEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        soundEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        notificationPermission: {
            type: DataTypes.ENUM('granted', 'denied', 'default'),
            defaultValue: 'default'
        }
    }, {
        tableName: 'notification_settings',
        timestamps: true
    });

    // BackupSettings 모델 정의
    const BackupSettings = sequelize.define('BackupSettings', {
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
        autoBackup: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        backupInterval: {
            type: DataTypes.STRING(50),
            defaultValue: 'daily'
        },
        lastBackupDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        backupLocation: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        backupSize: {
            type: DataTypes.BIGINT,
            defaultValue: 0
        }
    }, {
        tableName: 'backup_settings',
        timestamps: true
    });

    // TimeSettings 모델 정의
    const TimeSettings = sequelize.define('TimeSettings', {
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
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        startTime: {
            type: DataTypes.TIME,
            allowNull: false
        },
        endTime: {
            type: DataTypes.TIME,
            allowNull: false
        },
        enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        days: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: []
        }
    }, {
        tableName: 'time_settings',
        timestamps: true,
        indexes: [
            {
                fields: ['userId', 'title'],
                unique: true
            }
        ]
    });

    // 모델 간 관계 설정
    Settings.associate = (models) => {
        Settings.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    NotificationSettings.associate = (models) => {
        NotificationSettings.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    BackupSettings.associate = (models) => {
        BackupSettings.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    TimeSettings.associate = (models) => {
        TimeSettings.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return {
        Settings,
        NotificationSettings,
        BackupSettings,
        TimeSettings
    };
};