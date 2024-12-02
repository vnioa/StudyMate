const { DataTypes } = require('sequelize');

// 상수 정의
const FILE_TYPES = {
    PDF: 'PDF',
    IMAGE: 'Image',
    VIDEO: 'Video',
    OTHER: 'Other'
};

const FILE_STATUS = {
    ACTIVE: 'active',
    DELETED: 'deleted',
    EXPIRED: 'expired'
};

const SHARE_PERMISSIONS = {
    VIEW: 'view',
    EDIT: 'edit',
    FULL: 'full'
};

module.exports = (sequelize) => {
    // File 모델 정의
    const File = sequelize.define('File', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '파일 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '회원번호'
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: '파일명'
        },
        type: {
            type: DataTypes.ENUM(Object.values(FILE_TYPES)),
            allowNull: false,
            comment: '파일 유형'
        },
        size: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: '파일 크기(bytes)'
        },
        path: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: '파일 경로'
        },
        mimeType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'MIME 타입'
        },
        isShared: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '공유 여부'
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '만료 일자'
        },
        downloadCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '다운로드 횟수'
        },
        thumbnailUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: '썸네일 URL'
        },
        status: {
            type: DataTypes.ENUM(Object.values(FILE_STATUS)),
            defaultValue: FILE_STATUS.ACTIVE,
            comment: '파일 상태'
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '메타데이터'
        }
    }, {
        tableName: 'files',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['type'] },
            { fields: ['isShared'] },
            { fields: ['status'] }
        ]
    });

    // FileShare 모델 정의
    const FileShare = sequelize.define('FileShare', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '파일 공유 ID'
        },
        fileId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'files',
                key: 'id'
            },
            comment: '파일 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '공유받은 회원번호'
        },
        permission: {
            type: DataTypes.ENUM(Object.values(SHARE_PERMISSIONS)),
            defaultValue: SHARE_PERMISSIONS.VIEW,
            comment: '권한 수준'
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '공유 만료일'
        }
    }, {
        tableName: 'file_shares',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['fileId', 'memberId'], unique: true }
        ]
    });

    // FileVersion 모델 정의
    const FileVersion = sequelize.define('FileVersion', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '버전 ID'
        },
        fileId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'files',
                key: 'id'
            },
            comment: '파일 ID'
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '버전 번호'
        },
        path: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: '버전 파일 경로'
        },
        size: {
            type: DataTypes.BIGINT,
            allowNull: false,
            comment: '버전 파일 크기'
        },
        changeLog: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '변경 내역'
        }
    }, {
        tableName: 'file_versions',
        timestamps: true,
        paranoid: true
    });

    // 모델 간 관계 설정
    File.associate = (models) => {
        File.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'owner'
        });

        File.hasMany(FileVersion, {
            foreignKey: 'fileId',
            as: 'versions'
        });

        File.belongsToMany(models.Auth, {
            through: FileShare,
            foreignKey: 'fileId',
            otherKey: 'memberId',
            as: 'sharedWith'
        });
    };

    FileShare.associate = (models) => {
        FileShare.belongsTo(File, {
            foreignKey: 'fileId',
            as: 'file'
        });

        FileShare.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'sharedWithMember'
        });
    };

    FileVersion.associate = (models) => {
        FileVersion.belongsTo(File, {
            foreignKey: 'fileId',
            as: 'file'
        });
    };

    return {
        File,
        FileShare,
        FileVersion,
        FILE_TYPES,
        FILE_STATUS,
        SHARE_PERMISSIONS
    };
};