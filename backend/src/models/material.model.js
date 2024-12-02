const { DataTypes } = require('sequelize');

// 상수 정의
const FILE_TYPES = {
    PDF: 'pdf',
    DOC: 'doc',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    OTHER: 'other'
};

const MATERIAL_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
};

const SHARE_TYPES = {
    VIEW: 'view',
    EDIT: 'edit',
    DOWNLOAD: 'download'
};

module.exports = (sequelize) => {
    // Material 모델 정의
    const Material = sequelize.define('Material', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '자료 ID'
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
            comment: '작성자 회원번호'
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 200]
            },
            comment: '자료 제목'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: [0, 1000]
            },
            comment: '자료 설명'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '자료 내용'
        },
        references: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '참고 문헌'
        },
        fileUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
            validate: {
                isUrl: true
            },
            comment: '파일 URL'
        },
        fileType: {
            type: DataTypes.ENUM(Object.values(FILE_TYPES)),
            allowNull: true,
            comment: '파일 유형'
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            },
            comment: '파일 크기(bytes)'
        },
        downloadCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            },
            comment: '다운로드 횟수'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '공개 여부'
        },
        version: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            validate: {
                min: 1
            },
            comment: '현재 버전'
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '자료 카테고리'
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidTags(value) {
                    if (value && !Array.isArray(value)) {
                        throw new Error('태그는 배열 형태여야 합니다.');
                    }
                }
            },
            comment: '태그 목록'
        },
        status: {
            type: DataTypes.ENUM(Object.values(MATERIAL_STATUS)),
            defaultValue: MATERIAL_STATUS.DRAFT,
            comment: '자료 상태'
        }
    }, {
        tableName: 'materials',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['isPublic', 'status'] },
            { fields: ['category'] }
        ],
        scopes: {
            public: {
                where: {
                    isPublic: true,
                    status: MATERIAL_STATUS.PUBLISHED
                }
            },
            withoutContent: {
                attributes: {
                    exclude: ['content']
                }
            }
        }
    });

    // MaterialShare 모델 정의
    const MaterialShare = sequelize.define('MaterialShare', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '공유 ID'
        },
        materialId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'materials',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '자료 ID'
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
            comment: '수신자 회원번호'
        },
        shareType: {
            type: DataTypes.ENUM(Object.values(SHARE_TYPES)),
            defaultValue: SHARE_TYPES.VIEW,
            comment: '공유 권한'
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                isAfter: new Date().toISOString()
            },
            comment: '만료 시간'
        },
        accessCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            },
            comment: '접근 횟수'
        }
    }, {
        tableName: 'material_shares',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['materialId'] },
            { fields: ['memberId'] },
            { fields: ['expiresAt'] }
        ]
    });

    // MaterialVersion 모델 정의
    const MaterialVersion = sequelize.define('MaterialVersion', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '버전 ID'
        },
        materialId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'materials',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '자료 ID'
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            },
            comment: '버전 번호'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '버전 내용'
        },
        changes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '변경 사항'
        },
        updatedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'NO ACTION',
            onUpdate: 'CASCADE',
            comment: '수정자 회원번호'
        },
        commitMessage: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: '커밋 메시지'
        }
    }, {
        tableName: 'material_versions',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['materialId', 'version'], unique: true },
            { fields: ['updatedBy'] }
        ]
    });

    // 모델 간 관계 설정
    Material.associate = (models) => {
        Material.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'owner',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        Material.hasMany(MaterialShare, {
            foreignKey: 'materialId',
            as: 'shares',
            onDelete: 'CASCADE'
        });

        Material.hasMany(MaterialVersion, {
            foreignKey: 'materialId',
            as: 'versions',
            onDelete: 'CASCADE'
        });
    };

    MaterialShare.associate = (models) => {
        MaterialShare.belongsTo(Material, {
            foreignKey: 'materialId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        MaterialShare.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'recipient',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    MaterialVersion.associate = (models) => {
        MaterialVersion.belongsTo(Material, {
            foreignKey: 'materialId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        MaterialVersion.belongsTo(models.Auth, {
            foreignKey: 'updatedBy',
            as: 'editor',
            onDelete: 'NO ACTION',
            onUpdate: 'CASCADE'
        });
    };

    return {
        Material,
        MaterialShare,
        MaterialVersion,
        FILE_TYPES,
        MATERIAL_STATUS,
        SHARE_TYPES
    };
};