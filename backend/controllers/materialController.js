const db = require('../config/db');

// 학습 자료 상세 조회
const getMaterialDetail = async (req, res) => {
    const { materialId } = req.params;
    try {
        const [material] = await db.execute(
            'SELECT * FROM materials WHERE material_id = ? AND user_id = ?',
            [materialId, req.user.id]
        );

        if (material.length === 0) {
            return res.status(404).json({
                success: false,
                message: '학습 자료를 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            material: material[0]
        });
    } catch (error) {
        console.error('학습 자료 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 자료를 불러오는데 실패했습니다.'
        });
    }
};

// 학습 자료 수정
const updateMaterial = async (req, res) => {
    const { materialId } = req.params;
    const { title, description, content, references } = req.body;
    try {
        await db.execute(
            'UPDATE materials SET title = ?, description = ?, content = ?, references = ? WHERE material_id = ? AND user_id = ?',
            [title, description, content, references, materialId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('학습 자료 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 자료 수정에 실패했습니다.'
        });
    }
};

// 학습 자료 공유
const shareMaterial = async (req, res) => {
    const { materialId } = req.params;
    const { shareType, recipients } = req.body;
    try {
        await db.execute(
            'UPDATE materials SET share_type = ? WHERE material_id = ? AND user_id = ?',
            [shareType, materialId, req.user.id]
        );

        if (recipients && recipients.length > 0) {
            await Promise.all(recipients.map(recipientId =>
                db.execute(
                    'INSERT INTO material_shares (material_id, user_id, recipient_id) VALUES (?, ?, ?)',
                    [materialId, req.user.id, recipientId]
                )
            ));
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('학습 자료 공유 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 자료 공유에 실패했습니다.'
        });
    }
};

// 학습 자료 다운로드 URL 조회
const getMaterialDownloadUrl = async (req, res) => {
    const { materialId } = req.params;
    try {
        const [material] = await db.execute(
            'SELECT file_url FROM materials WHERE material_id = ? AND (user_id = ? OR share_type = "public")',
            [materialId, req.user.id]
        );

        if (material.length === 0) {
            return res.status(404).json({
                success: false,
                message: '다운로드할 수 없는 자료입니다.'
            });
        }

        res.status(200).json({
            downloadUrl: material[0].file_url
        });
    } catch (error) {
        console.error('다운로드 URL 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '다운로드 URL 조회에 실패했습니다.'
        });
    }
};

module.exports = {
    getMaterialDetail,
    updateMaterial,
    shareMaterial,
    getMaterialDownloadUrl
};