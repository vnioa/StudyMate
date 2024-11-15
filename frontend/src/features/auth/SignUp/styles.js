// screens/auth/SignUp/styles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    // 기본 컨테이너 스타일
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    avoidingView: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 20,
    },
    innerContainer: {
        alignItems: 'center',
        width: '100%',
    },

    // 제목 스타일
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#0057D9',
        marginBottom: 30,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: {
            width: 2,
            height: 2,
        },
        textShadowRadius: 5,
    },

    // 입력 필드 컨테이너
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 30,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        paddingHorizontal: 15,
    },

    // 아이콘 스타일
    icon: {
        marginRight: 10,
    },

    // 입력 필드
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#333',
    },

    // 중복 확인 버튼
    checkButton: {
        backgroundColor: '#0057D9',
        paddingVertical: 10,
        borderRadius: 25,
        alignItems: 'center',
        marginLeft: 10,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    checkButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // 유효성 검증 아이콘
    validationIcon: {
        marginLeft: 10,
    },

    // 회원가입 버튼
    signupButton: {
        backgroundColor: '#0057D9',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 20,
        width: '80%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    signupButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },

    // 인증 섹션
    verificationSection: {
        width: '100%',
        marginTop: 15,
    },
    verificationButton: {
        backgroundColor: '#0057D9',
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginVertical: 10,
    },
    verificationButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    verificationInput: {
        marginTop: 10,
    },

    // 결과 메시지
    resultContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        width: '100%',
    },
    resultText: {
        fontSize: 16,
        color: '#1976D2',
        textAlign: 'center',
        fontWeight: '500',
    },

    // 에러 메시지
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        marginTop: 5,
        marginLeft: 15,
    },

    // 비활성화 스타일
    disabledButton: {
        backgroundColor: '#B0BEC5',
    },
    disabledText: {
        color: '#90A4AE',
    },

    // 로딩 상태
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },

    // 반응형 스타일
    '@media (min-width: 768px)': {
        container: {
            maxWidth: 500,
            alignSelf: 'center',
        },
        title: {
            fontSize: 36,
        },
        input: {
            fontSize: 18,
        },
    },

    // 다크모드 스타일
    '@media (prefers-color-scheme: dark)': {
        safeArea: {
            backgroundColor: '#1A1A1A',
        },
        inputContainer: {
            backgroundColor: '#2C2C2E',
            borderColor: '#3A3A3C',
        },
        input: {
            color: '#FFFFFF',
        },
        title: {
            color: '#0A84FF',
        },
        resultContainer: {
            backgroundColor: '#1C1C1E',
        },
        resultText: {
            color: '#0A84FF',
        },
        errorText: {
            color: '#FF453A',
        },
    },

    // 애니메이션 관련 스타일
    fadeIn: {
        opacity: 1,
        transform: [{ scale: 1 }],
    },
    fadeOut: {
        opacity: 0,
        transform: [{ scale: 0.9 }],
    }
});