const express = require('express');
const router = express.Router();
const themeController = require('../controllers/settings/theme.controller');
const backupController = require('../controllers/settings/backup.controller');
const accessibilityController = require('../controllers/settings/accessibility.controller');
const auth = require('../middleware/auth.middleware');

// 테마 및 언어 설정
router.get('/theme', auth, themeController.getThemeSettings);
router.put('/theme/mode', auth, themeController.updateTheme);
router.put('/theme/language', auth, themeController.updateLanguage);
router.put('/theme/font', auth, themeController.updateFontFamily);

// 백업 및 동기화 설정
router.get('/backup', auth, backupController.getBackupList);
router.post('/backup/create', auth, backupController.createBackup);
router.post('/backup/restore/:backupId', auth, backupController.restoreBackup);
router.delete('/backup/:backupId', auth, backupController.deleteBackup);

// 접근성 설정
router.get('/accessibility', auth, accessibilityController.getAccessibilitySettings);
router.put('/accessibility/contrast', auth, accessibilityController.updateHighContrast);
router.put('/accessibility/font-size', auth, accessibilityController.updateFontSize);
router.put('/accessibility/keyboard', auth, accessibilityController.updateKeyboardShortcuts);
router.put('/accessibility/screen-reader', auth, accessibilityController.updateScreenReader);

module.exports = router;