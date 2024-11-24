const db = require('../../config/mysql');

class AccessibilityController {
    // 접근성 설정 조회
    async getAccessibilitySettings(req, res) {
        try {
            const userId = req.user.id;
            const [settings] = await db.execute(
                'SELECT high_contrast, font_size, keyboard_shortcuts, screen_reader FROM accessibility_settings WHERE user_id = ?',
                [userId]
            );

            if (settings.length === 0) {
                // 기본 설정값 반환
                return res.status(200).json({
                    success: true,
                    settings: {
                        highContrast: false,
                        fontSize: 'medium',
                        keyboardShortcuts: true,
                        screenReader: false
                    }
                });
            }

            res.status(200).json({
                success: true,
                settings: settings[0]
            });
        } catch (error) {
            console.error('접근성 설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '접근성 설정 조회에 실패했습니다.'
            });
        }
    }

    // 고대비 모드 설정
    async updateHighContrast(req, res) {
        try {
            const userId = req.user.id;
            const { enabled } = req.body;

            await db.execute(
                'INSERT INTO accessibility_settings (user_id, high_contrast) VALUES (?, ?) ON DUPLICATE KEY UPDATE high_contrast = ?',
                [userId, enabled, enabled]
            );

            res.status(200).json({
                success: true,
                message: `고대비 모드가 ${enabled ? '활성화' : '비활성화'}되었습니다.`
            });
        } catch (error) {
            console.error('고대비 모드 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '고대비 모드 설정에 실패했습니다.'
            });
        }
    }

    // 글꼴 크기 설정
    async updateFontSize(req, res) {
        try {
            const userId = req.user.id;
            const { fontSize } = req.body;

            if (!['small', 'medium', 'large', 'extra-large'].includes(fontSize)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 글꼴 크기입니다.'
                });
            }

            await db.execute(
                'INSERT INTO accessibility_settings (user_id, font_size) VALUES (?, ?) ON DUPLICATE KEY UPDATE font_size = ?',
                [userId, fontSize, fontSize]
            );

            res.status(200).json({
                success: true,
                message: '글꼴 크기가 변경되었습니다.'
            });
        } catch (error) {
            console.error('글꼴 크기 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '글꼴 크기 설정에 실패했습니다.'
            });
        }
    }

    // 키보드 단축키 설정
    async updateKeyboardShortcuts(req, res) {
        try {
            const userId = req.user.id;
            const { shortcuts } = req.body;

            await db.execute(
                'INSERT INTO accessibility_settings (user_id, keyboard_shortcuts) VALUES (?, ?) ON DUPLICATE KEY UPDATE keyboard_shortcuts = ?',
                [userId, JSON.stringify(shortcuts), JSON.stringify(shortcuts)]
            );

            res.status(200).json({
                success: true,
                message: '키보드 단축키 설정이 저장되었습니다.'
            });
        } catch (error) {
            console.error('키보드 단축키 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '키보드 단축키 설정에 실패했습니다.'
            });
        }
    }

    // 스크린 리더 설정
    async updateScreenReader(req, res) {
        try {
            const userId = req.user.id;
            const { enabled } = req.body;

            await db.execute(
                'INSERT INTO accessibility_settings (user_id, screen_reader) VALUES (?, ?) ON DUPLICATE KEY UPDATE screen_reader = ?',
                [userId, enabled, enabled]
            );

            res.status(200).json({
                success: true,
                message: `스크린 리더가 ${enabled ? '활성화' : '비활성화'}되었습니다.`
            });
        } catch (error) {
            console.error('스크린 리더 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '스크린 리더 설정에 실패했습니다.'
            });
        }
    }
}

module.exports = new AccessibilityController();