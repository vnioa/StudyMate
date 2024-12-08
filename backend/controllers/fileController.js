const db = require('../config/db');

// 파일 목록 조회
const getFiles = async (req, res) => {
    try {
        const [files] = await db.execute(
            'SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json({ files });
    } catch (error) {
        console.error('파일 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 파일 타입별 필터링
const filterFilesByType = async (req, res) => {
    const { type } = req.params;
    try {
        let query = 'SELECT * FROM files WHERE user_id = ?';
        const params = [req.user.id];

        if (type !== 'All') {
            query += ' AND file_type = ?';
            params.push(type);
        }

        const [files] = await db.execute(query, params);
        res.status(200).json({ files });
    } catch (error) {
        console.error('파일 필터링 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 필터링에 실패했습니다.'
        });
    }
};

// 파일 검색
const searchFiles = async (req, res) => {
    const { query } = req.query;
    try {
        const [files] = await db.execute(
            'SELECT * FROM files WHERE user_id = ? AND (file_name LIKE ? OR description LIKE ?)',
            [req.user.id, `%${query}%`, `%${query}%`]
        );
        res.status(200).json({ files });
    } catch (error) {
        console.error('파일 검색 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 검색에 실패했습니다.'
        });
    }
};

// 파일 공유 설정 업데이트
const updateFileSharing = async (req, res) => {
    const { fileId } = req.params;
    const { isShared } = req.body;
    try {
        await db.execute(
            'UPDATE files SET is_shared = ? WHERE file_id = ? AND user_id = ?',
            [isShared, fileId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('파일 공유 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 공유 설정 업데이트에 실패했습니다.'
        });
    }
};

// 파일 만료일 설정
const setFileExpiry = async (req, res) => {
    const { fileId } = req.params;
    const { expiryDate } = req.body;
    try {
        await db.execute(
            'UPDATE files SET expiry_date = ? WHERE file_id = ? AND user_id = ?',
            [expiryDate, fileId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('파일 만료일 설정 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 만료일 설정에 실패했습니다.'
        });
    }
};

// 파일 미리보기
const getFilePreview = async (req, res) => {
    const { fileId } = req.params;
    try {
        const [file] = await db.execute(
            'SELECT * FROM files WHERE file_id = ? AND user_id = ?',
            [fileId, req.user.id]
        );

        if (file.length === 0) {
            return res.status(404).json({
                success: false,
                message: '파일을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            preview: file[0].preview_url
        });
    } catch (error) {
        console.error('파일 미리보기 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 미리보기를 불러오는데 실패했습니다.'
        });
    }
};

// 파일 삭제
const deleteFile = async (req, res) => {
    const { fileId } = req.params;
    try {
        await db.execute(
            'DELETE FROM files WHERE file_id = ? AND user_id = ?',
            [fileId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('파일 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 삭제에 실패했습니다.'
        });
    }
};

module.exports = {
    getFiles,
    filterFilesByType,
    searchFiles,
    updateFileSharing,
    setFileExpiry,
    getFilePreview,
    deleteFile
};