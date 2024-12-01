const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Invitation 모델 정의
    const Invitation = sequelize.define('Invitation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        senderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        receiverId: {
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
        type: {
            type: DataTypes.ENUM('group', 'study', 'mentoring'),
            allowNull: false
        },
        targetId: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: '초대 대상 (그룹/스터디/멘토링) ID'
        },
        message: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        respondedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'invitations',
        timestamps: true,
        indexes: [
            {
                fields: ['senderId']
            },
            {
                fields: ['receiverId']
            },
            {
                fields: ['status']
            },
            {
                fields: ['type', 'targetId']
            }
        ]
    });

    // InvitationHistory 모델 정의
    const InvitationHistory = sequelize.define('InvitationHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        invitationId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'invitations',
                key: 'id'
            }
        },
        action: {
            type: DataTypes.ENUM('sent', 'accepted', 'rejected', 'expired'),
            allowNull: false
        },
        performedBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'invitation_history',
        timestamps: true
    });

    // 모델 간 관계 설정
    Invitation.associate = (models) => {
        Invitation.belongsTo(models.User, {
            foreignKey: 'senderId',
            as: 'sender'
        });

        Invitation.belongsTo(models.User, {
            foreignKey: 'receiverId',
            as: 'receiver'
        });

        Invitation.hasMany(InvitationHistory, {
            foreignKey: 'invitationId',
            as: 'history'
        });
    };

    InvitationHistory.associate = (models) => {
        InvitationHistory.belongsTo(Invitation, {
            foreignKey: 'invitationId'
        });

        InvitationHistory.belongsTo(models.User, {
            foreignKey: 'performedBy',
            as: 'performer'
        });
    };

    return {
        Invitation,
        InvitationHistory
    };
};