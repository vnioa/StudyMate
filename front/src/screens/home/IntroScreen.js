import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';

// 앱 인트로 페이지
const IntroScreen = ({ navigation }) => {
    // 애니메이션 설정
    const fadeAnim = new Animated.Value(0);

    // 타이틀 등장 애니메이션
    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* 앱 타이틀 */}
            <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
                StudyMate
            </Animated.Text>

            {/* 인트로 이미지 */}
            <Image
                source={require('../../../assets/images/icons/study-group.png')} // 메인 이미지 경로 수정 필요
                style={styles.image}
                resizeMode="contain"
            />

            {/* 로그인 버튼 */}
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.buttonText}>로그인</Text>
            </TouchableOpacity>

            {/* 회원가입 버튼 */}
            <TouchableOpacity
                style={[styles.button, styles.signupButton]}
                onPress={() => navigation.navigate('SignUp')}
            >
                <Text style={styles.buttonText}>회원가입</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E3F2FD', // 배경색: 부드럽고 밝은 파란색 (편안하고 깔끔한 느낌을 줌)
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
});

export default IntroScreen;