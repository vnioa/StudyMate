const { DataTypes } = require('sequelize');

// 상수 정의
const MEMBER_ROLES = {
    ADMIN: 'admin',
    MEMBER: 'member'
};

const REQUEST_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
};

const ACTIVITY_TYPES = {
    JOIN: 'join',
    LEAVE: 'leave',
    POST: 'post',
    COMMENT: 'comment',
    LIKE: 'like'
};

const VISIBILITY_TYPES = {
    PUBLIC: 'public',
    PRIVATE: 'private'
};

module.exports = (sequelize) => {
    // Group 모델 정의
    const Group = sequelize.define('Group', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '그룹 ID'
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100]
            },
            comment: '그룹명'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '그룹 설명'
        },
        image: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            },
            comment: '그룹 이미지 URL'
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '그룹 카테고리'
        },
        memberLimit: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            validate: {
                min: 1,
                max: 1000
            },
            comment: '최대 멤버 수'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '공개 여부'
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '생성자 회원번호'
        }
    }, {
        tableName: 'study_groups',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['category'] },
            { fields: ['isPublic'] }
        ]
    });

    // GroupMember 모델 정의
    const GroupMember = sequelize.define('GroupMember', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '그룹 멤버 ID'
        },
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'study_groups',
                key: 'id'
            },
            comment: '그룹 ID'
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
        role: {
            type: DataTypes.ENUM(Object.values(MEMBER_ROLES)),
            defaultValue: MEMBER_ROLES.MEMBER,
            comment: '멤버 역할'
        },
        joinedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: '가입일'
        }
    }, {
        tableName: 'study_group_members',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['groupId', 'memberId'], unique: true }
        ]
    });

    // GroupJoinRequest 모델 정의
    const GroupJoinRequest = sequelize.define('GroupJoinRequest', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '가입 요청 ID'
        },
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'study_groups',
                key: 'id'
            },
            comment: '그룹 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '요청자 회원번호'
        },
        status: {
            type: DataTypes.ENUM(Object.values(REQUEST_STATUS)),
            defaultValue: REQUEST_STATUS.PENDING,
            comment: '요청 상태'
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '요청 메시지'
        }
    }, {
        tableName: 'study_group_join_requests',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['groupId', 'memberId', 'status'] }
        ]
    });

    // GroupActivity 모델 정의
    const GroupActivity = sequelize.define('GroupActivity', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '활동 ID'
        },
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'study_groups',
                key: 'id'
            },
            comment: '그룹 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '활동자 회원번호'
        },
        type: {
            type: DataTypes.ENUM(Object.values(ACTIVITY_TYPES)),
            allowNull: false,
            comment: '활동 유형'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '활동 내용'
        }
    }, {
        tableName: 'study_group_activities',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['groupId', 'type'] },
            { fields: ['memberId'] }
        ]
    });

    // GroupSettings 모델 정의
    const GroupSettings = sequelize.define('GroupSettings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '설정 ID'
        },
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'study_groups',
                key: 'id'
            },
            comment: '그룹 ID'
        },
        joinApproval: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '가입 승인 필요 여부'
        },
        postApproval: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '게시글 승인 필요 여부'
        },
        allowInvites: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '초대 허용 여부'
        },
        visibility: {
            type: DataTypes.ENUM(Object.values(VISIBILITY_TYPES)),
            defaultValue: VISIBILITY_TYPES.PUBLIC,
            comment: '그룹 공개 범위'
        }
    }, {
        tableName: 'study_group_settings',
        timestamps: true,
        paranoid: true
    });

    // 모델 간 관계 설정은 동일하게 유지
    Group.associate = (models) => {
        Group.belongsTo(models.Auth, {
            foreignKey: 'createdBy',
            as: 'creator'
        });
        Group.belongsToMany(models.Auth, {
            through: GroupMember,
            foreignKey: 'groupId',
            otherKey: 'memberId',
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
        GroupMember.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member'
        });
        GroupMember.belongsTo(Group, {
            foreignKey: 'groupId',
            as: 'group'
        });
    };

    GroupJoinRequest.associate = (models) => {
        GroupJoinRequest.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member'
        });
        GroupJoinRequest.belongsTo(Group, {
            foreignKey: 'groupId',
            as: 'group'
        });
    };

    GroupActivity.associate = (models) => {
        GroupActivity.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member'
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
        GroupSettings,
        MEMBER_ROLES,
        REQUEST_STATUS,
        ACTIVITY_TYPES,
        VISIBILITY_TYPES
    };
};