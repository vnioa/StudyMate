const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const chatController = require('../controllers/chat.controller');
const feedbackController = require('../controllers/feedback.controller');
const auth = require('../middleware/auth');
const { isGroupAdmin, isMember } = require('../middleware/role');

// 그룹 관리
router.post('/groups',
    auth,
    groupController.createGroup
);

router.get('/groups',
    auth,
    groupController.getGroups
);

router.get('/groups/:groupId',
    auth,
    isMember(),
    groupController.getGroupDetails
);

// 채팅
router.post('/chat/message',
    auth,
    isMember(),
    chatController.sendMessage
);

router.get('/chat/:groupId/messages',
    auth,
    isMember(),
    chatController.getMessages
);

router.get('/chat/:groupId/participants',
    auth,
    isMember(),
    chatController.getChatParticipants
);

// 피드백
router.post('/feedback/self',
    auth,
    feedbackController.createSelfEvaluation
);

router.post('/feedback/peer',
    auth,
    isMember(),
    feedbackController.createPeerFeedback
);

router.post('/feedback/journal',
    auth,
    feedbackController.createStudyJournal
);

module.exports = router;