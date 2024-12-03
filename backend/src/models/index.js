const { Sequelize } = require('sequelize');
const config = require('../config/database.config');

const sequelize = new Sequelize(
    config.mysql.database,
    config.mysql.user,
    config.mysql.password,
    {
        host: config.mysql.host,
        dialect: 'mysql',
        logging: false,
        pool: config.mysql.pool,
        timezone: '+09:00',  // 한국 시간대
        define: {
            timestamps: true,
            paranoid: true,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        }
    }
);

// 모델 정의
const models = {
    User: require('./user.model')(sequelize),
    Auth: require('./auth.model')(sequelize),
    Profile: require('./profile.model')(sequelize),
    Chat: require('./chat.model')(sequelize),
    Friend: require('./friends.model')(sequelize),
    Group: require('./group.model')(sequelize),
    Study: require('./study.model')(sequelize),
    Material: require('./material.model')(sequelize),
    Achievement: require('./achievement.model')(sequelize),
    Notification: require('./notification.model')(sequelize),
    Settings: require('./settings.model')(sequelize),
    Storage: require('./storage.model')(sequelize),
    Backup: require('./backup.model')(sequelize),
    Level: require('./level.model')(sequelize),
    Goal: require('./goal.model')(sequelize),
    Feedback: require('./feedback.model')(sequelize),
    Community: require('./community.model')(sequelize),
    Invite: require('./invite.model')(sequelize),
    Mentor: require('./mentor.model')(sequelize),
    File: require('./file.model')(sequelize)
};

// 모델 로딩 검증 및 관계 설정
Object.keys(models).forEach(modelName => {
    if (!models[modelName]) {
        throw new Error(`${modelName} 모델 로딩 실패`);
    }
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

// 데이터베이스 연결 테스트
const init = async () => {
    try {
        await sequelize.authenticate();
        console.log('데이터베이스 연결 성공');
    } catch (error) {
        console.error('데이터베이스 연결 실패:', error);
        process.exit(1);
    }
};

// 초기화 실행
init().catch(error => {
    console.error('초기화 실패:', error);
    process.exit(1);
});

module.exports = {
    sequelize,
    Sequelize,
    ...models
};