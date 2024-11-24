const express = require('express');
const router = express.Router();
const scheduleController = require('../../controllers/group/schedule.controller');
const auth = require('../../middleware/group/auth.middleware');
const { isGroupAdmin, isMember } = require('../../middleware/group/role.middleware');

// 일정 생성 및 관리
router.post('/:groupId/schedule',
    auth,
    isMember(),
    scheduleController.createSchedule
);

router.get('/:groupId/schedule',
    auth,
    isMember(),
    scheduleController.getSchedules
);

// 일정 상세 관리
router.put('/:groupId/schedule/:scheduleId',
    auth,
    isMember(),
    scheduleController.updateSchedule
);

router.delete('/:groupId/schedule/:scheduleId',
    auth,
    isGroupAdmin(),
    scheduleController.deleteSchedule
);

// 참가자 관리
router.post('/:groupId/schedule/:scheduleId/participants',
    auth,
    isMember(),
    scheduleController.updateParticipantStatus
);

router.get('/:groupId/schedule/:scheduleId/participants',
    auth,
    isMember(),
    scheduleController.getParticipants
);

// 알림 설정
router.put('/:groupId/schedule/:scheduleId/reminders',
    auth,
    isMember(),
    scheduleController.updateReminders
);

// 반복 일정 관리
router.put('/:groupId/schedule/:scheduleId/recurrence',
    auth,
    isGroupAdmin(),
    scheduleController.updateRecurrence
);

module.exports = router;