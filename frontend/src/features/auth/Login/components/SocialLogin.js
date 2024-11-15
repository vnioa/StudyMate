import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SocialLogin = () => {
    const handleSocialLogin = (platform) => {
        // 소셜 로그인 구현
        console.log(`${platform} 로그인 시도`);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('google')}
            >
                <Ionicons name="logo-google" size={24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('kakao')}
            >
                <Ionicons name="chatbubble" size={24} color="#FAE100" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('naver')}
            >
                <Ionicons name="logo-github" size={24} color="#2DB400" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    socialButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

export default SocialLogin;