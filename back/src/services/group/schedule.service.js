const db = require('../config/mysql');

class ScheduleService {
    // 일정 생성
    async createSchedule(groupId, creatorId, scheduleData) {
        try {
            const { title, description, startTime, endTime, type } = scheduleData;

            const [result] = await db.execute(
                'INSERT INTO group_schedules (group_id, creator_id, title, description, start_time, end_time, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [groupId, creatorId, title, description, startTime, endTime, type]
            );

            return result.insertId;
        } catch (error) {
            console.error('일정 생성 오류:', error);
            throw new Error('일정 생성에 실패했습니다.');
        }
    }

    // 일정 목록 조회
    async getSchedules(groupId, startDate, endDate) {
        try {
            const [schedules] = await db.execute(
                `SELECT s.*, u.name as creator_name
                 FROM group_schedules s
                          JOIN users u ON s.creator_id = u.id
                 WHERE s.group_id = ? AND s.start_time BETWEEN ? AND ?`,
                [groupId, startDate, endDate]
            );

            return schedules;
        } catch (error) {
            console.error('일정 조회 오류:', error);
            throw new Error('일정 조회에 실패했습니다.');
        }
    }

    // 일정 수정
    async updateSchedule(scheduleId, scheduleData) {
        try {
            const { title, description, startTime, endTime, type } = scheduleData;

            await db.execute(
                'UPDATE group_schedules SET title = ?, description = ?, start_time = ?, end_time = ?, type = ? WHERE id = ?',
                [title, description, startTime, endTime, type, scheduleId]
            );

            return true;
        } catch (error) {
            console.error('일정 수정 오류:', error);
            throw new Error('일정 수정에 실패했습니다.');
        }
    }

    // 참가자 상태 업데이트
    async updateParticipantStatus(scheduleId, userId, status) {
        try {
            await db.execute(
                'INSERT INTO schedule_participants (schedule_id, user_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
                [scheduleId, userId, status, status]
            );

            return true;
        } catch (error) {
            console.error('참가자 상태 업데이트 오류:', error);
            throw new Error('참가자 상태 업데이트에 실패했습니다.');
        }
    }

    // 일정 삭제
    async deleteSchedule(scheduleId) {
        try {
            await db.execute('DELETE FROM group_schedules WHERE id = ?', [scheduleId]);
            return true;
        } catch (error) {
            console.error('일정 삭제 오류:', error);
            throw new Error('일정 삭제에 실패했습니다.');
        }
    }
}

module.exports = new ScheduleService();