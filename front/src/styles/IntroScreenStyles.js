import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E3F2FD', // 부드럽고 밝은 파란색 배경
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#0057D9',
        marginBottom: 20,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    image: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#0057D9',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    signupButton: {
        backgroundColor: '#4CAF50', // 회원가입 버튼 색상 (녹색)
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default styles;