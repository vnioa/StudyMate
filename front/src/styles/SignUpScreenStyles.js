import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    // 전체 화면 스타일
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA', // 부드럽고 깔끔한 배경색
    },
    avoidingView: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    innerContainer: {
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#0057D9',
        marginBottom: 20,
        textAlign: 'center',
    },

    // 입력 필드 스타일
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 30,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3, // Android 그림자
        paddingHorizontal: 15,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#333', // 입력 텍스트 색상
    },

    // 중복 확인 및 인증 버튼 스타일
    checkButton: {
        backgroundColor: '#0057D9',
        paddingVertical: 10,
        borderRadius: 25,
        alignItems: 'center',
        marginLeft: 10,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6, // Android 그림자
    },
    checkButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // 검증 아이콘 스타일 (비밀번호 확인 등)
    validationIcon: {
        marginLeft: 10, // 아이콘 위치 조정
    },

    // 회원가입 버튼 스타일
    signupButtonContainer: {
        width: "100%",
        alignItems: "center",
        marginTop: "15px"
    },
    signupButton: {
        backgroundColor: "#0057D9",
        paddingVertical: "15px",
        borderRadius: "30px",
        alignItems: "center",
        marginTop: "20px",
        width: "80%",
        shadowColor: "#000"
    },
    signupButtonText: {
        fontWeight: 'bold',
        color: "#fff",
        fontSize: "18px"
    },
})