const db = require('../../config/mysql');
const fs = require('fs');
const path = require('path');

class FileController {
    // 파일 업로드
    async uploadFile(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;
            const file = req.file;

            const [result] = await db.execute(
                'INSERT INTO chat_files (room_id, user_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)',
                [roomId, userId, file.originalname, file.path, file.mimetype, file.size]
            );

            res.status(201).json({
                success: true,
                fileId: result.insertId,
                message: '파일이 업로드되었습니다.'
            });
        } catch (error) {
            console.error('파일 업로드 오류:', error);
            res.status(500).json({
                success: false,
                message: '파일 업로드에 실패했습니다.'
            });
        }
    }

    // 파일 다운로드
    async downloadFile(req, res) {
        try {
            const { fileId } = req.params;

            const [file] = await db.execute(
                'SELECT * FROM chat_files WHERE id = ?',
                [fileId]
            );

            if (file.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '파일을 찾을 수 없습니다.'
                });
            }

            res.download(file[0].file_path, file[0].file_name);
        } catch (error) {
            console.error('파일 다운로드 오류:', error);
            res.status(500).json({
                success: false,
                message: '파일 다운로드에 실패했습니다.'
            });
        }
    }

    // 파일 삭제
    async deleteFile(req, res) {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;

            const [file] = await db.execute(
                'SELECT * FROM chat_files WHERE id = ? AND user_id = ?',
                [fileId, userId]
            );

            if (file.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '파일을 삭제할 권한이 없습니다.'
                });
            }

            // 파일 시스템에서 삭제
            fs.unlinkSync(file[0].file_path);

            // DB에서 삭제
            await db.execute('DELETE FROM chat_files WHERE id = ?', [fileId]);

            res.status(200).json({
                success: true,
                message: '파일이 삭제되었습니다.'
            });
        } catch (error) {
            console.error('파일 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '파일 삭제에 실패했습니다.'
            });
        }
    }

    // 파일 목록 조회
    async getFiles(req, res) {
        try {
            const { roomId } = req.params;
            const { type } = req.query;

            let query = 'SELECT * FROM chat_files WHERE room_id = ?';
            const params = [roomId];

            if (type) {
                query += ' AND file_type LIKE ?';
                params.push(`${type}%`);
            }

            const [files] = await db.execute(query, params);

            res.status(200).json({
                success: true,
                files
            });
        } catch (error) {
            console.error('파일 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '파일 목록 조회에 실패했습니다.'
            });
        }
    }
}

module.exports = new FileController();