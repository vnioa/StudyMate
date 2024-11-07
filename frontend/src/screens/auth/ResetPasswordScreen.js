import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const ResetPasswordScreen = ({ navigation }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isPasswordMatch, setIsPasswordMatch] = useState(true);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [strengthBarWidth] = useState(new Animated.Value(0));

    // 비밀번호 강도 검사 및 애니메이션
    const checkPasswordStrength = (password) => {
        let strength = '';
        let width = 0;
        if (password.length >= 8) {
            if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
                strength = '강함';
                width = 1;
            } else if (/[A-Z]/.test(password) || /[0-9]/.test(password)) {
                strength = '중간';
                width = 0.7;
            } else {
                strength = '약함';
                width = 0.4;
            }
        } else {
            strength = '너무 짧음';
            width = 0.2;
        }
        setPasswordStrength(strength);

        Animated.timing(strengthBarWidth, {
            toValue: width,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: false,
        }).start();
    };

    // 비밀번호 재설정 요청 함수
    const handleResetPassword = async () => {
        if (!username || !email || !verificationCode || !newPassword) {
            Alert.alert('모든 필드를 올바르게 입력해 주세요.');
            return;
        }

        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/reset-password', {
                username,
                email,
                code: verificationCode,
                newPassword,
            });

            if (response.data.success) {
                Alert.alert('비밀번호가 성공적으로 재설정되었습니다.');
                navigation.navigate('LoginScreen'); // 비밀번호 재설정 후 로그인 화면으로 이동
            } else {
                Alert.alert(response.data.message || '비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('비밀번호 재설정 오류:', error); // 오류 로그 추가
            Alert.alert('비밀번호 재설정 요청에 실패했습니다. 다시 시도해주세요.');
        }
    };


    // 비밀번호 일치 여부 확인
    const handlePasswordChange = (value) => {
        setNewPassword(value);
        checkPasswordStrength(value);
        setIsPasswordMatch(value === confirmPassword);
    };

    // 비밀번호 재입력 일치 여부 확인
    const handleConfirmPasswordChange = (value) => {
        setConfirmPassword(value);
        setIsPasswordMatch(newPassword === value);
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>비밀번호 재설정</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="새 비밀번호"
                        value={newPassword}
                        onChangeText={handlePasswordChange}
                        secureTextEntry={!isPasswordVisible}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off' : 'eye'}
                            size={20}
                            color="#888"
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.strengthBarBackground}>
                    <Animated.View
                        style={[
                            styles.strengthBar,
                            {
                                backgroundColor: passwordStrength === '강함' ? 'green' : passwordStrength === '중간' ? 'orange' : 'red',
                                width: strengthBarWidth.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    />
                </View>
                <Text style={styles.passwordStrength}>비밀번호 강도: {passwordStrength}</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, !isPasswordMatch && styles.inputError]}
                        placeholder="비밀번호 재입력"
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                        secureTextEntry={!isPasswordVisible}
                        autoCapitalize="none"
                    />
                </View>
                {!isPasswordMatch && (
                    <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
                )}
                <TouchableOpacity
                    style={[styles.button, (!newPassword || !confirmPassword || !isPasswordMatch) && styles.buttonDisabled]}
                    onPress={handleResetPassword}
                    disabled={!newPassword || !confirmPassword || !isPasswordMatch}
                >
                    <Text style={styles.buttonText}>비밀번호 재설정</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eef2f7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '90%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0057D9',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    inputIcon: {
        marginLeft: 10,
    },
    input: {
        flex: 1,
        height: 44,
        paddingHorizontal: 10,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: 'red',
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
    },
    strengthBarBackground: {
        height: 5,
        backgroundColor: '#ddd',
        borderRadius: 5,
        marginVertical: 5,
    },
    strengthBar: {
        height: 5,
        borderRadius: 5,
    },
    passwordStrength: {
        marginBottom: 10,
        fontSize: 14,
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#0057D9',
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#999',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ResetPasswordScreen;
