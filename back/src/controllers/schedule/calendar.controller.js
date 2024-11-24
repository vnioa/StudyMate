const db = require('../../config/mysql');

class CalendarController {
    // 일정 생성
    async createEvent(req, res) {
        try {
            const { userId, title, description, startTime, endTime, type, isRecurring, recurringPattern } = req.body;

            const [result] = await db.execute(
                'INSERT INTO study_calendar (user_id, title, description, start_time, end_time, type, is_recurring, recurring_pattern) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, title, description, startTime, endTime, type, isRecurring, recurringPattern]
            );

            res.status(201).json({
                success: true,
                eventId: result.insertId,
                message: '일정이 생성되었습니다.'
            });
        } catch (error) {
            console.error('일정 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '일정 생성에 실패했습니다.'
            });
        }
    }

    // 일정 목록 조회
    async getEvents(req, res) {
        try {
            const { userId, startDate, endDate, type } = req.query;
            let query = 'SELECT * FROM study_calendar WHERE user_id = ? AND start_time BETWEEN ? AND ?';
            const params = [userId, startDate, endDate];

            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }

            const [events] = await db.execute(query, params);

            res.status(200).json({
                success: true,
                events
            });
        } catch (error) {
            console.error('일정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '일정 조회에 실패했습니다.'
            });
        }
    }

    // 일정 수정
    async updateEvent(req, res) {
        try {
            const { eventId } = req.params;
            const { title, description, startTime, endTime, type, isRecurring, recurringPattern } = req.body;
            const userId = req.user.id;

            await db.execute(
                'UPDATE study_calendar SET title = ?, description = ?, start_time = ?, end_time = ?, type = ?, is_recurring = ?, recurring_pattern = ? WHERE id = ? AND user_id = ?',
                [title, description, startTime, endTime, type, isRecurring, recurringPattern, eventId, userId]
            );

            res.status(200).json({
                success: true,
                message: '일정이 수정되었습니다.'
            });
        } catch (error) {
            console.error('일정 수정 오류:', error);
            res.status(500).json({
                success: false,
                message: '일정 수정에 실패했습니다.'
            });
        }
    }

    // 일정 삭제
    async deleteEvent(req, res) {
        try {
            const { eventId } = req.params;
            const userId = req.user.id;

            await db.execute(
                'DELETE FROM study_calendar WHERE id = ? AND user_id = ?',
                [eventId, userId]
            );

            res.status(200).json({
                success: true,
                message: '일정이 삭제되었습니다.'
            });
        } catch (error) {
            console.error('일정 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '일정 삭제에 실패했습니다.'
            });
        }
    }
}

module.exports = new CalendarController();