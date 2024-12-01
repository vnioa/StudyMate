const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // File 모델 정의
    const File = sequelize.define('File', {
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
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('PDF', 'Image', 'Video', 'Other'),
            allowNull: false
        },
        size: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        path: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        mimeType: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        isShared: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        downloadCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        thumbnailUrl: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('active', 'deleted', 'expired'),
            defaultValue: 'active'
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        tableName: 'files',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['type']
            },
            {
                fields: ['isShared']
            },
            {
                fields: ['status']
            }
        ]
    });

    // FileShare 모델 정의
    const FileShare = sequelize.define('FileShare', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        fileId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'files',
                key: 'id'
            }
        },
        sharedWithId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        permission: {
            type: DataTypes.ENUM('view', 'edit', 'full'),
            defaultValue: 'view'
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'file_shares',
        timestamps: true,
        indexes: [
            {
                fields: ['fileId', 'sharedWithId'],
                unique: true
            }
        ]
    });

    // FileVersion 모델 정의
    const FileVersion = sequelize.define('FileVersion', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        fileId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'files',
                key: 'id'
            }
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        path: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        size: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        changeLog: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'file_versions',
        timestamps: true
    });

    // 모델 간 관계 설정
    File.associate = (models) => {
        File.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'owner'
        });

        File.hasMany(FileVersion, {
            foreignKey: 'fileId',
            as: 'versions'
        });

        File.belongsToMany(models.User, {
            through: FileShare,
            foreignKey: 'fileId',
            as: 'sharedWith'
        });
    };

    FileShare.associate = (models) => {
        FileShare.belongsTo(File, {
            foreignKey: 'fileId'
        });

        FileShare.belongsTo(models.User, {
            foreignKey: 'sharedWithId',
            as: 'sharedWithUser'
        });
    };

    FileVersion.associate = (models) => {
        FileVersion.belongsTo(File, {
            foreignKey: 'fileId'
        });
    };

    return {
        File,
        FileShare,
        FileVersion
    };
};