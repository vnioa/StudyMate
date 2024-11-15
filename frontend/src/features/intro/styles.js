// screens/intro/styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E3F2FD',
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
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // 반응형 스타일
    '@media (min-width: 768px)': {
        title: {
            fontSize: 48,
        },
        image: {
            width: 300,
            height: 300,
        },
        button: {
            paddingVertical: 15,
            paddingHorizontal: 50,
        },
        buttonText: {
            fontSize: 18,
        },
    },
});