const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    personalInfo: {
        name: String,
        email: String,
        phoneNumber: String,
        birthdate: Date
    },
    profileImage: {
        url: String,
        uploadDate: Date
    },
    backgroundImage: {
        url: String,
        uploadDate: Date
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'public'
    },
    socialConnections: [{
        provider: {
            type: String,
            enum: ['google', 'facebook', 'kakao', 'naver']
        },
        providerId: String,
        connected: {
            type: Boolean,
            default: true
        },
        connectedAt: {
            type: Date,
            default: Date.now
        }
    }],
    preferences: {
        language: {
            type: String,
            default: 'ko'
        },
        theme: {
            type: String,
            default: 'light'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// 인덱스 생성
profileSchema.index({ userId: 1 });
profileSchema.index({ 'socialConnections.providerId': 1 });

// 프로필 업데이트 시 lastUpdated 자동 갱신
profileSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// 프로필 이미지 URL 생성 메서드
profileSchema.methods.getProfileImageUrl = function() {
    return this.profileImage?.url || '/default-profile.png';
};

// 프로필 공개 여부 확인 메서드
profileSchema.methods.isVisibleTo = function(viewerId) {
    if (this.visibility === 'public') return true;
    if (this.visibility === 'private') return this.userId === viewerId;
    // friends 로직은 필요에 따라 구현
    return false;
};

// 소셜 계정 연동 메서드
profileSchema.methods.connectSocialAccount = async function(provider, providerId) {
    const existingConnection = this.socialConnections.find(
        conn => conn.provider === provider
    );

    if (existingConnection) {
        existingConnection.connected = true;
        existingConnection.connectedAt = new Date();
    } else {
        this.socialConnections.push({
            provider,
            providerId,
            connected: true
        });
    }

    return await this.save();
};

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;