import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const ResetPasswordScreen = ({ route, navigation }) => {
    const { email, userId } = route.params;
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });

    const handleResetPassword = async () => {
        if (formData.password !== formData.confirmPassword) {
            Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/reset-password', {
                email,
                userId,
                newPassword: formData.password,
            });

            if (response.data.success) {
                Alert.alert('알림', '비밀번호가 재설정되었습니다.', [
                    {
                        text: '확인',
                        onPress: () => navigation.navigate('Login'),
                    },
                ]);
            }
        } catch (error) {
            Alert.alert('오류', '비밀번호 재설정에 실패했습니다.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>비밀번호 재설정</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                    style={styles.input}
                    placeholder="비밀번호"
                    value={formData.password}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                    style={styles.input}
                    placeholder="비밀번호 재입력"
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                    secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                    />
                </TouchableOpacity>
                {formData.confirmPassword !== '' && (
                    <Ionicons
                        name={formData.password === formData.confirmPassword ? "checkmark-circle" : "close-circle"}
                        size={20}
                        color={formData.password === formData.confirmPassword ? "#4CAF50" : "#FF0000"}
                        style={styles.validationIcon}
                    />
                )}
            </View>

            <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetPassword}
            >
                <Text style={styles.resetButtonText}>재설정하기</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    validationIcon: {
        marginLeft: 10,
    },
    resetButton: {
        backgroundColor: '#0066FF',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ResetPasswordScreen;