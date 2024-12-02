const { DataTypes } = require('sequelize');

// 상수 정의
const INVITATION_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    CANCELED: 'canceled'
};

const INVITATION_TYPES = {
    GROUP: 'group',
    STUDY: 'study',
    MENTORING: 'mentoring'
};

const HISTORY_ACTIONS = {
    SENT: 'sent',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    CANCELED: 'canceled',
    REMINDED: 'reminded'
};

module.exports = (sequelize) => {
    // Invitation 모델 정의
    const Invitation = sequelize.define('Invitation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '초대 ID'
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '발신자 회원번호'
        },
        receiverId: {
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
        status: {
            type: DataTypes.ENUM(Object.values(INVITATION_STATUS)),
            defaultValue: INVITATION_STATUS.PENDING,
            comment: '초대 상태'
        },
        type: {
            type: DataTypes.ENUM(Object.values(INVITATION_TYPES)),
            allowNull: false,
            comment: '초대 유형'
        },
        targetId: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: '초대 대상 (그룹/스터디/멘토링) ID'
        },
        message: {
            type: DataTypes.STRING(200),
            allowNull: true,
            validate: {
                len: [0, 200]
            },
            comment: '초대 메시지'
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                isAfterNow(value) {
                    if (value && value <= new Date()) {
                        throw new Error('만료 시간은 현재 시간 이후여야 합니다.');
                    }
                }
            },
            comment: '만료 시간'
        },
        respondedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '응답 시간'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '읽음 여부'
        }
    }, {
        tableName: 'invitations',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['senderId'], name: 'idx_invitation_sender' },
            { fields: ['receiverId'], name: 'idx_invitation_receiver' },
            { fields: ['status', 'expiresAt'], name: 'idx_invitation_status' },
            { fields: ['type', 'targetId'], name: 'idx_invitation_target' }
        ],
        scopes: {
            pending: {
                where: {
                    status: INVITATION_STATUS.PENDING,
                    expiresAt: {
                        [sequelize.Op.gt]: new Date()
                    }
                }
            },
            active: {
                where: {
                    status: [INVITATION_STATUS.PENDING, INVITATION_STATUS.ACCEPTED]
                }
            }
        }
    });

    // InvitationHistory 모델 정의
    const InvitationHistory = sequelize.define('InvitationHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '초대 이력 ID'
        },
        invitationId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'invitations',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '초대 ID'
        },
        action: {
            type: DataTypes.ENUM(Object.values(HISTORY_ACTIONS)),
            allowNull: false,
            comment: '수행된 작업'
        },
        performedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'NO ACTION',
            onUpdate: 'CASCADE',
            comment: '작업 수행자 회원번호'
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: [0, 1000]
            },
            comment: '비고'
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidMetadata(value) {
                    if (value && typeof value !== 'object') {
                        throw new Error('메타데이터는 객체 형태여야 합니다.');
                    }
                }
            },
            comment: '추가 메타데이터'
        }
    }, {
        tableName: 'invitation_history',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['invitationId'], name: 'idx_invitation_history_invitation' },
            { fields: ['performedBy'], name: 'idx_invitation_history_performer' },
            { fields: ['action', 'createdAt'], name: 'idx_invitation_history_action' }
        ]
    });

    // 모델 간 관계 설정
    Invitation.associate = (models) => {
        Invitation.belongsTo(models.Auth, {
            foreignKey: 'senderId',
            as: 'sender',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        Invitation.belongsTo(models.Auth, {
            foreignKey: 'receiverId',
            as: 'receiver',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        Invitation.hasMany(InvitationHistory, {
            foreignKey: 'invitationId',
            as: 'history',
            onDelete: 'CASCADE'
        });
    };

    InvitationHistory.associate = (models) => {
        InvitationHistory.belongsTo(Invitation, {
            foreignKey: 'invitationId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        InvitationHistory.belongsTo(models.Auth, {
            foreignKey: 'performedBy',
            as: 'performer',
            onDelete: 'NO ACTION',
            onUpdate: 'CASCADE'
        });
    };

    return {
        Invitation,
        InvitationHistory,
        INVITATION_STATUS,
        INVITATION_TYPES,
        HISTORY_ACTIONS
    };
};