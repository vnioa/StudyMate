import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// 색상 팔레트
export const colors = {
    // 브랜드 컬러
    primary: {
        main: '#4A90E2',
        light: '#6AA9E9',
        dark: '#357ABD',
        contrast: '#FFFFFF',
    },

    // 보조 컬러
    secondary: {
        main: '#FF6B6B',
        light: '#FF8787',
        dark: '#E65252',
        contrast: '#FFFFFF',
    },

    // 기능별 컬러
    functional: {
        study: '#4CAF50',
        group: '#9C27B0',
        chat: '#2196F3',
        friend: '#FF9800',
    },

    // 상태 컬러
    status: {
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#F44336',
        info: '#2196F3',
        online: '#4CAF50',
        offline: '#9E9E9E',
        busy: '#F44336',
    },

    // 그레이 스케일
    grey: {
        50: '#FAFAFA',
        100: '#F5F5F5',
        200: '#EEEEEE',
        300: '#E0E0E0',
        400: '#BDBDBD',
        500: '#9E9E9E',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
    },

    // 배경 컬러
    background: {
        primary: '#FFFFFF',
        secondary: '#F8F9FA',
        tertiary: '#F1F3F5',
        modal: 'rgba(0, 0, 0, 0.5)',
    },

    // 텍스트 컬러
    text: {
        primary: '#212121',
        secondary: '#757575',
        disabled: '#9E9E9E',
        hint: '#BDBDBD',
        contrast: '#FFFFFF',
    },

    // 테두리 컬러
    border: '#E0E0E0',

    // 학습 관련 컬러
    study: {
        subject: {
            math: '#FF5252',
            science: '#4CAF50',
            english: '#2196F3',
            history: '#FFC107',
            language: '#9C27B0',
            art: '#FF9800',
            music: '#00BCD4',
            default: '#9E9E9E',
        },
        progress: {
            low: '#FF5252',
            medium: '#FFC107',
            high: '#4CAF50',
        },
        timer: {
            study: '#4CAF50',
            break: '#FF9800',
            overtime: '#F44336',
        },
    },
};

// 타이포그래피
export const typography = {
    fontFamily: {
        regular: 'SFPro-Regular',
        medium: 'SFPro-Medium',
        bold: 'SFPro-Bold',
    },
    size: {
        h1: 32,
        h2: 24,
        h3: 20,
        h4: 18,
        body1: 16,
        body2: 14,
        caption: 12,
        small: 10,
    },
    lineHeight: {
        h1: 40,
        h2: 32,
        h3: 28,
        h4: 24,
        body1: 24,
        body2: 20,
        caption: 16,
        small: 14,
    },
};

// 간격
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// 레이아웃
export const layout = {
    window: {
        width,
        height,
    },
    isSmallDevice: width < 375,
    screen: {
        padding: spacing.md,
    },
    components: {
        buttonHeight: 48,
        inputHeight: 48,
        borderRadius: 8,
        iconSize: {
            small: 16,
            medium: 24,
            large: 32,
        },
    },
};

// 그림자
export const shadows = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
};

// 애니메이션
export const animations = {
    timing: {
        fast: 200,
        normal: 300,
        slow: 500,
    },
    easing: {
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
    },
};

// 공통 스타일
export const commonStyles = {
    // 기본 컨테이너
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    safeArea: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    // 카드
    card: {
        ...shadows.small,
        backgroundColor: colors.background.primary,
        borderRadius: layout.components.borderRadius,
        padding: spacing.md,
    },
    // 버튼
    button: {
        height: layout.components.buttonHeight,
        borderRadius: layout.components.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    // 입력 필드
    input: {
        height: layout.components.inputHeight,
        borderRadius: layout.components.borderRadius,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        fontSize: typography.size.body1,
    },
    // 중앙 정렬
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    // 행 정렬
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // 간격
    spaceBetween: {
        justifyContent: 'space-between',
    },
    // 스크롤뷰
    scrollView: {
        flex: 1,
    },
    // 구분선
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
};

// 기능별 스타일
export const featureStyles = {
    // 학습 관련
    study: {
        timerContainer: {
            ...commonStyles.card,
            padding: spacing.lg,
        },
        progressBar: {
            height: 8,
            borderRadius: 4,
        },
        statsCard: {
            ...commonStyles.card,
            marginVertical: spacing.sm,
        },
    },
    // 채팅 관련
    chat: {
        bubble: {
            maxWidth: '75%',
            borderRadius: 16,
            padding: spacing.sm,
            marginVertical: spacing.xs,
        },
        input: {
            ...commonStyles.input,
            maxHeight: 100,
        },
    },
    // 그룹 관련
    group: {
        memberAvatar: {
            size: 40,
            borderRadius: 20,
        },
        header: {
            height: 200,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
        },
    },
    // 프로필 관련
    profile: {
        avatar: {
            size: 80,
            borderRadius: 40,
        },
        statsBox: {
            ...commonStyles.card,
            flex: 1,
            marginHorizontal: spacing.xs,
        },
    },
};

// 테마 객체
export const theme = {
    colors,
    typography,
    spacing,
    layout,
    shadows,
    animations,
    commonStyles,
    featureStyles,
};

export default theme;