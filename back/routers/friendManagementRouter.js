// routers/friendManagementRouter.js
const express = require('express');
const router = express.Router();
const { getFriendList, analyzeFriendships, getFriendRecommendations, updateFriendshipStrength } = require('../controllers/friendManagementController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/list', getFriendList);
router.get('/analyze', analyzeFriendships);
router.get('/recommendations', getFriendRecommendations);
router.put('/update-strength', updateFriendshipStrength);

module.exports = router;