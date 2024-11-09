// routers/communicationHubRouter.js
const express = require('express');
const router = express.Router();
const { getCommunicationData, initiateCall } = require('../controllers/communicationHubController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', getCommunicationData);
router.post('/call', initiateCall);

module.exports = router;