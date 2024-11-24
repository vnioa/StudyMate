const db = require('../config/mysql');
const fs = require('fs');
const path = require('path');

class FileService {
    // 파일 업로드
    async uploadFile(roomId, userId, fileData) {
        try {
            const { originalname, path: filePath, mimetype, size } = fileData;

            const [result] = await db.execute(
                'INSERT INTO chat_files (room_id, user_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)',
                [roomId, userId, originalname, filePath, mimetype, size]
            );

            return result.insertId;
        } catch (error) {
            console.error('파일 업로드 오류:', error);
            throw error;
        }
    }

    // 파일 다운로드
    async getFile(fileId) {
        try {
            const [file] = await db.execute(
                'SELECT * FROM chat_files WHERE id = ?',
                [fileId]
            );

            if (file.length === 0) {
                throw new Error('파일을 찾을 수 없습니다.');
            }

            // 다운로드 수 증가
            await db.execute(
                'UPDATE chat_files SET downloads = downloads + 1 WHERE id = ?',
                [fileId]
            );

            return file[0];
        } catch (error) {
            console.error('파일 다운로드 오류:', error);
            throw error;
        }
    }

    // 파일 삭제
    async deleteFile(fileId, userId) {
        try {
            const [file] = await db.execute(
                'SELECT * FROM chat_files WHERE id = ? AND user_id = ?',
                [fileId, userId]
            );

            if (file.length === 0) {
                throw new Error('파일을 삭제할 권한이 없습니다.');
            }

            // 파일 시스템에서 삭제
            fs.unlinkSync(file[0].file_path);

            // DB에서 삭제
            await db.execute('DELETE FROM chat_files WHERE id = ?', [fileId]);

            return true;
        } catch (error) {
            console.error('파일 삭제 오류:', error);
            throw error;
        }
    }

    // 파일 목록 조회
    async getFiles(roomId, type) {
        try {
            let query = 'SELECT * FROM chat_files WHERE room_id = ?';
            const params = [roomId];

            if (type) {
                query += ' AND file_type LIKE ?';
                params.push(`${type}%`);
            }

            query += ' ORDER BY created_at DESC';

            const [files] = await db.execute(query, params);
            return files;
        } catch (error) {
            console.error('파일 목록 조회 오류:', error);
            throw error;
        }
    }
}

module.exports = new FileService();