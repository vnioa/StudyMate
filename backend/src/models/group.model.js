const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Group 모델 정의
    const Group = sequelize.define('Group', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        image: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        memberLimit: {
            type: DataTypes.INTEGER,
            defaultValue: 100
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    });

    // GroupMember 모델 정의
    const GroupMember = sequelize.define('GroupMember', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        groupId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'groups',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        role: {
            type: DataTypes.ENUM('admin', 'member'),
            defaultValue: 'member'
        },
        joinedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    // GroupJoinRequest 모델 정의
    const GroupJoinRequest = sequelize.define('GroupJoinRequest', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        groupId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'groups',
                key: 'id'
            }
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
            type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
            defaultValue: 'pending'
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });

    // GroupActivity 모델 정의
    const GroupActivity = sequelize.define('GroupActivity', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        groupId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'groups',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.ENUM('join', 'leave', 'post', 'comment', 'like'),
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });

    // GroupSettings 모델 정의
    const GroupSettings = sequelize.define('GroupSettings', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        groupId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: {
                model: 'groups',
                key: 'id'
            }
        },
        joinApproval: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        postApproval: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        allowInvites: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        visibility: {
            type: DataTypes.ENUM('public', 'private'),
            defaultValue: 'public'
        }
    });

    // 모델 간 관계 설정
    Group.associate = (models) => {
        Group.belongsTo(models.User, {
            foreignKey: 'createdBy',
            as: 'creator'
        });

        Group.belongsToMany(models.User, {
            through: GroupMember,
            foreignKey: 'groupId',
            as: 'members'
        });

        Group.hasMany(GroupActivity, {
            foreignKey: 'groupId',
            as: 'activities'
        });

        Group.hasOne(GroupSettings, {
            foreignKey: 'groupId',
            as: 'settings'
        });
    };

    GroupMember.associate = (models) => {
        GroupMember.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });

        GroupMember.belongsTo(Group, {
            foreignKey: 'groupId',
            as: 'group'
        });
    };

    GroupJoinRequest.associate = (models) => {
        GroupJoinRequest.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });

        GroupJoinRequest.belongsTo(Group, {
            foreignKey: 'groupId',
            as: 'group'
        });
    };

    GroupActivity.associate = (models) => {
        GroupActivity.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });

        GroupActivity.belongsTo(Group, {
            foreignKey: 'groupId',
            as: 'group'
        });
    };

    return {
        Group,
        GroupMember,
        GroupJoinRequest,
        GroupActivity,
        GroupSettings
    };
};