import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FindPasswordForm = ({
                              username,
                              email,
                              verificationCode,
                              setUsername,
                              setEmail,
                              setVerificationCode,
                              onRequestCode,
                              onVerifyCode,
                              isCodeVerified,
                              navigation
                          }) => {
    return (
        <View>
            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#0057D9" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="아이디"
                    value={username}
                    onChangeText={setUsername}
                    placeholderTextColor="#888"
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#0057D9" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="등록된 이메일"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#888"
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={onRequestCode}>
                <Text style={styles.buttonText}>인증코드 발송</Text>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color="#0057D9" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="인증코드를 입력하세요"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="numeric"
                    placeholderTextColor="#888"
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={onVerifyCode}>
                <Text style={styles.buttonText}>코드 확인</Text>
            </TouchableOpacity>

            {isCodeVerified && (
                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => navigation.navigate('ResetPasswordScreen')}
                >
                    <Text style={styles.buttonText}>비밀번호 재설정</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3
    },
    inputIcon: {
        marginRight: 10
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 16,
        color: '#333'
    },
    button: {
        backgroundColor: '#0057D9',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    resultContainer: {
        marginTop: 10,
        padding: 15,
        backgroundColor: '#e0f7fa',
        borderRadius: 10
    },
    resultText: {
        fontSize: 16,
        color: '#00796b',
        textAlign: 'center'
    },
    resetButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6
    }
});

export default FindPasswordForm;