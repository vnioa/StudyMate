// controllers/friendManagementController.js
const db = require('../config/db');
const { analyzeRelationships, generateFriendRecommendations } = require('../utils/aiUtils');

exports.getFriendList = async (req, res) => {
    const userId = req.user.id;
    try {
        const [friends] = await db.execute(
            'SELECT u.id, u.username, u.profile_image, f.relationship_strength FROM users u JOIN friendships f ON (u.id = f.friend_id) WHERE f.user_id = ?',
            [userId]
        );
        res.status(200).json({ success: true, friends });
    } catch (error) {
        console.error('친구 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '친구 목록 조회에 실패했습니다.' });
    }
};

exports.analyzeFriendships = async (req, res) => {
    const userId = req.user.id;
    try {
        const [interactions] = await db.execute(
            'SELECT * FROM user_interactions WHERE user_id = ? OR friend_id = ?',
            [userId, userId]
        );
        const analysis = await analyzeRelationships(interactions);
        res.status(200).json({ success: true, analysis });
    } catch (error) {
        console.error('친구 관계 분석 오류:', error);
        res.status(500).json({ success: false, message: '친구 관계 분석에 실패했습니다.' });
    }
};

exports.getFriendRecommendations = async (req, res) => {
    const userId = req.user.id;
    try {
        const [userInfo] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        const [friendsOfFriends] = await db.execute(
            'SELECT DISTINCT u.* FROM users u JOIN friendships f1 ON u.id = f1.friend_id JOIN friendships f2 ON f1.user_id = f2.friend_id WHERE f2.user_id = ? AND u.id != ?',
            [userId, userId]
        );
        const recommendations = await generateFriendRecommendations(userInfo[0], friendsOfFriends);
        res.status(200).json({ success: true, recommendations });
    } catch (error) {
        console.error('친구 추천 오류:', error);
        res.status(500).json({ success: false, message: '친구 추천에 실패했습니다.' });
    }
};

exports.updateFriendshipStrength = async (req, res) => {
    const userId = req.user.id;
    const { friendId, strength } = req.body;
    try {
        await db.execute(
            'UPDATE friendships SET relationship_strength = ? WHERE user_id = ? AND friend_id = ?',
            [strength, userId, friendId]
        );
        res.status(200).json({ success: true, message: '친구 관계 강도가 업데이트되었습니다.' });
    } catch (error) {
        console.error('친구 관계 강도 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '친구 관계 강도 업데이트에 실패했습니다.' });
    }
};