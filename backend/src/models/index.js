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
        pool: config.mysql.pool
    }
);

// 모델 정의
const models = {
    User: require('./user.model')(sequelize, Sequelize),
    Auth: require('./auth.model')(sequelize, Sequelize),
    Profile: require('./profile.model')(sequelize, Sequelize),
    Chat: require('./chat.model')(sequelize, Sequelize),
    Friend: require('./friends.model')(sequelize, Sequelize),
    Group: require('./group.model')(sequelize, Sequelize),
    Study: require('./study.model')(sequelize, Sequelize),
    Material: require('./material.model')(sequelize, Sequelize),
    Achievement: require('./achievement.model')(sequelize, Sequelize),
    Notification: require('./notification.model')(sequelize, Sequelize),
    Settings: require('./settings.model')(sequelize, Sequelize),
    Storage: require('./storage.model')(sequelize, Sequelize),
    Backup: require('./backup.model')(sequelize, Sequelize),
    Level: require('./level.model')(sequelize, Sequelize),
    Goal: require('./goal.model')(sequelize, Sequelize),
    Feedback: require('./feedback.model')(sequelize, Sequelize),
    Community: require('./community.model')(sequelize, Sequelize),
    Invite: require('./invite.model')(sequelize, Sequelize),
    Mentor: require('./mentor.model')(sequelize, Sequelize),
    File: require('./file.model')(sequelize, Sequelize)
};

// 관계 설정
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

// 데이터베이스 연결 테스트
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('데이터베이스 연결 성공');
    } catch (error) {
        console.error('데이터베이스 연결 실패:', error);
    }
};

await testConnection();

module.exports = {
    sequelize,
    Sequelize,
    ...models
};