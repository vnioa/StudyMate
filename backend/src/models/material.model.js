const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Material 모델 정의
    const Material = sequelize.define('Material', {
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
            type: DataTypes.STRING(200),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        references: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        fileUrl: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        fileType: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        downloadCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        version: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    }, {
        tableName: 'materials',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['isPublic']
            }
        ]
    });

    // MaterialShare 모델 정의
    const MaterialShare = sequelize.define('MaterialShare', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        materialId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'materials',
                key: 'id'
            }
        },
        recipientId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        shareType: {
            type: DataTypes.ENUM('view', 'edit', 'download'),
            defaultValue: 'view'
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'material_shares',
        timestamps: true,
        indexes: [
            {
                fields: ['materialId']
            },
            {
                fields: ['recipientId']
            }
        ]
    });

    // MaterialVersion 모델 정의
    const MaterialVersion = sequelize.define('MaterialVersion', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        materialId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'materials',
                key: 'id'
            }
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        changes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        updatedBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'material_versions',
        timestamps: true,
        indexes: [
            {
                fields: ['materialId', 'version'],
                unique: true
            }
        ]
    });

    // 모델 간 관계 설정
    Material.associate = (models) => {
        Material.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'owner'
        });

        Material.hasMany(MaterialShare, {
            foreignKey: 'materialId',
            as: 'shares'
        });

        Material.hasMany(MaterialVersion, {
            foreignKey: 'materialId',
            as: 'versions'
        });
    };

    MaterialShare.associate = (models) => {
        MaterialShare.belongsTo(Material, {
            foreignKey: 'materialId'
        });

        MaterialShare.belongsTo(models.User, {
            foreignKey: 'recipientId',
            as: 'recipient'
        });
    };

    MaterialVersion.associate = (models) => {
        MaterialVersion.belongsTo(Material, {
            foreignKey: 'materialId'
        });

        MaterialVersion.belongsTo(models.User, {
            foreignKey: 'updatedBy',
            as: 'editor'
        });
    };

    return {
        Material,
        MaterialShare,
        MaterialVersion
    };
};