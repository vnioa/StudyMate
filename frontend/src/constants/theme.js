// constants/theme.js
import { COLORS } from './colors';

export const THEME = {
    // 타이포그래피
    TYPOGRAPHY: {
        H1: {
            fontSize: 28,
            fontWeight: '700',
            lineHeight: 34
        },
        H2: {
            fontSize: 24,
            fontWeight: '600',
            lineHeight: 30
        },
        H3: {
            fontSize: 20,
            fontWeight: '600',
            lineHeight: 26
        },
        BODY1: {
            fontSize: 16,
            fontWeight: '400',
            lineHeight: 24
        },
        BODY2: {
            fontSize: 14,
            fontWeight: '400',
            lineHeight: 20
        },
        CAPTION: {
            fontSize: 12,
            fontWeight: '400',
            lineHeight: 16
        }
    },

    // 스페이싱
    SPACING: {
        XS: 4,
        SM: 8,
        MD: 16,
        LG: 24,
        XL: 32
    },

    // 그림자
    SHADOWS: {
        SMALL: {
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 2,
        },
        MEDIUM: {
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.15,
            shadowRadius: 6.27,
            elevation: 5,
        },
        LARGE: {
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 6,
            },
            shadowOpacity: 0.2,
            shadowRadius: 7.49,
            elevation: 8,
        }
    },

    // 테두리
    BORDERS: {
        RADIUS: {
            SM: 4,
            MD: 8,
            LG: 12,
            XL: 16,
            FULL: 9999
        },
        WIDTH: {
            THIN: 1,
            MEDIUM: 2,
            THICK: 3
        }
    },

    // 애니메이션
    ANIMATION: {
        DURATION: {
            FAST: 200,
            NORMAL: 300,
            SLOW: 500
        },
        EASING: {
            EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
            EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
            EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
    },

    // 레이아웃
    LAYOUT: {
        CONTAINER: {
            PADDING: 16,
            MAX_WIDTH: 1200
        },
        HEADER: {
            HEIGHT: 56
        },
        BOTTOM_TAB: {
            HEIGHT: 49
        }
    },

    // 미디어 쿼리 브레이크포인트
    BREAKPOINTS: {
        MOBILE: 320,
        TABLET: 768,
        DESKTOP: 1024,
        LARGE_DESKTOP: 1440
    }
};