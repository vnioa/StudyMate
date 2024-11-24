const db = require('../../config/mysql');

class ThemeController {
    // 테마 설정 조회
    async getThemeSettings(req, res) {
        try {
            const userId = req.user.id;
            const [settings] = await db.execute(
                'SELECT theme, language, font_family FROM theme_settings WHERE user_id = ?',
                [userId]
            );

            if (settings.length === 0) {
                // 기본 설정값 반환
                return res.status(200).json({
                    success: true,
                    settings: {
                        theme: 'light',
                        language: 'ko',
                        fontFamily: 'system-default'
                    }
                });
            }

            res.status(200).json({
                success: true,
                settings: settings[0]
            });
        } catch (error) {
            console.error('테마 설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '테마 설정 조회에 실패했습니다.'
            });
        }
    }

    // 테마 모드 설정
    async updateTheme(req, res) {
        try {
            const userId = req.user.id;
            const { theme } = req.body;

            if (!['light', 'dark', 'system'].includes(theme)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 테마입니다.'
                });
            }

            await db.execute(
                'INSERT INTO theme_settings (user_id, theme) VALUES (?, ?) ON DUPLICATE KEY UPDATE theme = ?',
                [userId, theme, theme]
            );

            res.status(200).json({
                success: true,
                message: '테마가 변경되었습니다.'
            });
        } catch (error) {
            console.error('테마 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '테마 설정에 실패했습니다.'
            });
        }
    }

    // 언어 설정
    async updateLanguage(req, res) {
        try {
            const userId = req.user.id;
            const { language } = req.body;

            const supportedLanguages = ['ko', 'en', 'ja', 'zh'];
            if (!supportedLanguages.includes(language)) {
                return res.status(400).json({
                    success: false,
                    message: '지원하지 않는 언어입니다.'
                });
            }

            await db.execute(
                'INSERT INTO theme_settings (user_id, language) VALUES (?, ?) ON DUPLICATE KEY UPDATE language = ?',
                [userId, language, language]
            );

            res.status(200).json({
                success: true,
                message: '언어 설정이 변경되었습니다.'
            });
        } catch (error) {
            console.error('언어 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '언어 설정에 실패했습니다.'
            });
        }
    }

    // 폰트 설정
    async updateFontFamily(req, res) {
        try {
            const userId = req.user.id;
            const { fontFamily } = req.body;

            const supportedFonts = ['system-default', 'roboto', 'open-sans', 'noto-sans'];
            if (!supportedFonts.includes(fontFamily)) {
                return res.status(400).json({
                    success: false,
                    message: '지원하지 않는 폰트입니다.'
                });
            }

            await db.execute(
                'INSERT INTO theme_settings (user_id, font_family) VALUES (?, ?) ON DUPLICATE KEY UPDATE font_family = ?',
                [userId, fontFamily, fontFamily]
            );

            res.status(200).json({
                success: true,
                message: '폰트가 변경되었습니다.'
            });
        } catch (error) {
            console.error('폰트 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '폰트 설정에 실패했습니다.'
            });
        }
    }
}

module.exports = new ThemeController();