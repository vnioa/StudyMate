const { Sequelize } = require('sequelize');
const config = require('../config/mysql');

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: 'mysql',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// 모델 파일들 import
const User = require('./user.model')(sequelize);
const Auth = require('./auth.model')(sequelize);
const Profile = require('./profile.model')(sequelize);
const Chat = require('./chat.model')(sequelize);
const Friend = require('./friends.model')(sequelize);
const Group = require('./group.model')(sequelize);
const Study = require('./study.model')(sequelize);
const Material = require('./material.model')(sequelize);
const Achievement = require('./achievement.model')(sequelize);
const Notification = require('./notification.model')(sequelize);
const Settings = require('./settings.model')(sequelize);
const Storage = require('./storage.model')(sequelize);
const Backup = require('./backup.model')(sequelize);
const Level = require('./level.model')(sequelize);
const Goal = require('./goal.model')(sequelize);
const Feedback = require('./feedback.model')(sequelize);
const Community = require('./community.model')(sequelize);
const Invite = require('./invite.model')(sequelize);
const Mentor = require('./mentor.model')(sequelize);
const File = require('./file.model')(sequelize);

// 모델 간 관계 설정
Object.values(sequelize.models)
    .filter(model => typeof model.associate === 'function')
    .forEach(model => model.associate(sequelize.models));

// 데이터베이스 연결 테스트
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

testConnection();

module.exports = {
    sequelize,
    Sequelize,
    ...User,
    ...Auth,
    ...Profile,
    ...Chat,
    ...Friend,
    ...Group,
    ...Study,
    ...Material,
    ...Achievement,
    ...Notification,
    ...Settings,
    ...Storage,
    ...Backup,
    ...Level,
    ...Goal,
    ...Feedback,
    ...Community,
    ...Invite,
    ...Mentor,
    ...File
};