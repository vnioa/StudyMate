// IntroScreen.js
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
} from 'react-native';

const IntroScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>StudyMate</Text>

                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../../assets/intro.png')}
                        style={styles.image}
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.loginButton]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={[styles.buttonText, styles.loginText]}>로그인</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.signupButton]}
                        onPress={() => navigation.navigate('SignUp')}
                    >
                        <Text style={[styles.buttonText, styles.signupText]}>회원가입</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0066FF',
        marginBottom: 40,
    },
    imageContainer: {
        marginBottom: 60,
    },
    image: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
    },
    buttonContainer: {
        width: '100%',
        gap: 10,
    },
    button: {
        width: '100%',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButton: {
        backgroundColor: '#0066FF',
    },
    signupButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    loginText: {
        color: '#FFFFFF',
    },
    signupText: {
        color: '#FFFFFF',
    },
});

export default IntroScreen;