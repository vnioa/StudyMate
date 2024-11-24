const db = require('../config/mysql');
const { messaging } = require('../config/firebase');

class ReminderController {
    // 알림 설정 생성
    async createReminder(req, res) {
        try {
            const { userId, eventId, reminderType, reminderTime } = req.body;

            const [result] = await db.execute(
                'INSERT INTO study_reminders (user_id, event_id, reminder_type, reminder_time) VALUES (?, ?, ?, ?)',
                [userId, eventId, reminderType, reminderTime]
            );

            res.status(201).json({
                success: true,
                reminderId: result.insertId,
                message: '알림이 설정되었습니다.'
            });
        } catch (error) {
            console.error('알림 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 설정에 실패했습니다.'
            });
        }
    }

    // 알림 목록 조회
    async getReminders(req, res) {
        try {
            const { userId } = req.params;

            const [reminders] = await db.execute(
                `SELECT r.*, e.title as event_title, e.start_time 
         FROM study_reminders r 
         JOIN study_calendar e ON r.event_id = e.id 
         WHERE r.user_id = ? 
         ORDER BY r.reminder_time ASC`,
                [userId]
            );

            res.status(200).json({
                success: true,
                reminders
            });
        } catch (error) {
            console.error('알림 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 목록 조회에 실패했습니다.'
            });
        }
    }

    // 알림 수정
    async updateReminder(req, res) {
        try {
            const { reminderId } = req.params;
            const { reminderType, reminderTime } = req.body;
            const userId = req.user.id;

            await db.execute(
                'UPDATE study_reminders SET reminder_type = ?, reminder_time = ? WHERE id = ? AND user_id = ?',
                [reminderType, reminderTime, reminderId, userId]
            );

            res.status(200).json({
                success: true,
                message: '알림 설정이 수정되었습니다.'
            });
        } catch (error) {
            console.error('알림 수정 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 수정에 실패했습니다.'
            });
        }
    }

    // 알림 삭제
    async deleteReminder(req, res) {
        try {
            const { reminderId } = req.params;
            const userId = req.user.id;

            await db.execute(
                'DELETE FROM study_reminders WHERE id = ? AND user_id = ?',
                [reminderId, userId]
            );

            res.status(200).json({
                success: true,
                message: '알림이 삭제되었습니다.'
            });
        } catch (error) {
            console.error('알림 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '알림 삭제에 실패했습니다.'
            });
        }
    }
}

module.exports = new ReminderController();