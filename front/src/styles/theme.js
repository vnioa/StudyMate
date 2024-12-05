import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// 반응형 폰트 사이즈 계산
const scale = Math.min(width, height) / 320;
const normalize = (size) => Math.round(scale * size);

export const theme = {
    colors: {
        // 주요 색상
        primary: '#0066FF',
        secondary: '#5856D6',
        success: '#4CAF50',
        error: '#FF3B30',
        warning: '#FF9500',
        info: '#32ADE6',

        // 배경 색상
        background: '#FFFFFF',
        surface: '#F8F9FA',
        pressed: '#F0F0F0',

        // 텍스트 색상
        text: '#212529',
        textSecondary: '#666666',
        textTertiary: '#999999',
        textDisabled: '#CCCCCC',

        // 테두리 색상
        border: '#EEEEEE',
        divider: '#E5E5E5',

        // 상태 색상
        active: '#0066FF',
        inactive: '#999999',
        disabled: '#E5E5E5',

        // 그림자 색상
        shadow: '#000000',
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32
    },

    typography: {
        // 디스플레이
        displayLarge: {
            fontSize: normalize(57),
            lineHeight: normalize(64),
            fontWeight: '700',
            letterSpacing: -0.5,
        },
        displayMedium: {
            fontSize: normalize(45),
            lineHeight: normalize(52),
            fontWeight: '700',
            letterSpacing: 0,
        },
        displaySmall: {
            fontSize: normalize(36),
            lineHeight: normalize(44),
            fontWeight: '700',
            letterSpacing: 0,
        },

        // 헤드라인
        headlineLarge: {
            fontSize: normalize(32),
            lineHeight: normalize(40),
            fontWeight: '600',
            letterSpacing: 0,
        },
        headlineMedium: {
            fontSize: normalize(28),
            lineHeight: normalize(36),
            fontWeight: '600',
            letterSpacing: 0,
        },
        headlineSmall: {
            fontSize: normalize(24),
            lineHeight: normalize(32),
            fontWeight: '600',
            letterSpacing: 0,
        },

        // 본문
        bodyLarge: {
            fontSize: normalize(16),
            lineHeight: normalize(24),
            fontWeight: '400',
            letterSpacing: 0.5,
        },
        bodyMedium: {
            fontSize: normalize(14),
            lineHeight: normalize(20),
            fontWeight: '400',
            letterSpacing: 0.25,
        },
        bodySmall: {
            fontSize: normalize(12),
            lineHeight: normalize(16),
            fontWeight: '400',
            letterSpacing: 0.4,
        },
    },

    shadows: Platform.select({
        ios: {
            small: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
            },
            medium: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            large: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
            },
        },
        android: {
            small: {
                elevation: 2,
            },
            medium: {
                elevation: 4,
            },
            large: {
                elevation: 6,
            },
        },
    }),

    roundness: {
        small: 4,
        medium: 8,
        large: 12,
        extraLarge: 24,
        full: 999,
    },
};

export default theme;