const db = require('../../config/mysql');
const { messaging } = require('../../config/firebase');

class ScheduleController {
    // 그룹 일정 생성
    async createSchedule(req, res) {
        try {
            const { groupId, title, description, startTime, endTime, type } = req.body;
            const creatorId = req.user.id;

            const [result] = await db.execute(
                'INSERT INTO group_schedules (group_id, creator_id, title, description, start_time, end_time, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [groupId, creatorId, title, description, startTime, endTime, type]
            );

            // 그룹 멤버들에게 알림 전송
            const [members] = await db.execute(
                'SELECT user_id, fcm_token FROM group_members WHERE group_id = ? AND user_id != ?',
                [groupId, creatorId]
            );

            for (const member of members) {
                if (member.fcm_token) {
                    await messaging.send({
                        token: member.fcm_token,
                        notification: {
                            title: '새로운 그룹 일정',
                            body: `${title} 일정이 등록되었습니다.`
                        }
                    });
                }
            }

            res.status(201).json({
                success: true,
                scheduleId: result.insertId,
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

    // 그룹 일정 조회
    async getSchedules(req, res) {
        try {
            const { groupId, startDate, endDate } = req.query;

            const [schedules] = await db.execute(
                `SELECT s.*, u.name as creator_name 
         FROM group_schedules s 
         JOIN users u ON s.creator_id = u.id 
         WHERE s.group_id = ? AND s.start_time BETWEEN ? AND ?`,
                [groupId, startDate, endDate]
            );

            res.status(200).json({
                success: true,
                schedules
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
    async updateSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const { title, description, startTime, endTime, type } = req.body;
            const userId = req.user.id;

            // 권한 확인
            const [schedule] = await db.execute(
                'SELECT * FROM group_schedules WHERE id = ? AND creator_id = ?',
                [scheduleId, userId]
            );

            if (schedule.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '일정을 수정할 권한이 없습니다.'
                });
            }

            await db.execute(
                'UPDATE group_schedules SET title = ?, description = ?, start_time = ?, end_time = ?, type = ? WHERE id = ?',
                [title, description, startTime, endTime, type, scheduleId]
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
    async deleteSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const userId = req.user.id;

            // 권한 확인
            const [schedule] = await db.execute(
                'SELECT * FROM group_schedules WHERE id = ? AND creator_id = ?',
                [scheduleId, userId]
            );

            if (schedule.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '일정을 삭제할 권한이 없습니다.'
                });
            }

            await db.execute('DELETE FROM group_schedules WHERE id = ?', [scheduleId]);

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

module.exports = new ScheduleController();