import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from "../../services/api";

const ResetPasswordScreen = ({ route, navigation }) => {
    const { email, userId } = route.params;
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        password: '',
        confirmPassword: ''
    });

    const validateForm = () => {
        const newErrors = {};

        // 비밀번호 정책 검증
        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요';
        } else if (formData.password.length < 8) {
            newErrors.password = '비밀번호는 8자 이상이어야 합니다';
        } else if (!/[A-Z]/.test(formData.password)) {
            newErrors.password = '대문자를 포함해야 합니다';
        } else if (!/[0-9]/.test(formData.password)) {
            newErrors.password = '숫자를 포함해야 합니다';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호를 다시 입력해주세요';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleResetPassword = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const response = await authAPI.resetPassword({
                email: email.trim(),
                userId: userId.trim(),
                newPassword: formData.password
            });

            if (response.data.success) {
                Alert.alert('성공', '비밀번호가 재설정되었습니다.', [
                    {
                        text: '확인',
                        onPress: () => {
                            route.params?.onPasswordReset?.();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }]
                            });
                        }
                    }
                ]);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '비밀번호 재설정에 실패했습니다.\n잠시 후 다시 시도해주세요.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>비밀번호 재설정</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" />
                        <TextInput
                            style={[styles.input, errors.password && styles.inputError]}
                            placeholder="새 비밀번호"
                            value={formData.password}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, password: text }));
                                setErrors(prev => ({ ...prev, password: '' }));
                            }}
                            secureTextEntry={!showPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            disabled={loading}
                        >
                            <Ionicons
                                name={showPassword ? "eye-outline" : "eye-off-outline"}
                                size={20}
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.password && (
                        <Text style={styles.errorText}>{errors.password}</Text>
                    )}

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" />
                        <TextInput
                            style={[styles.input, errors.confirmPassword && styles.inputError]}
                            placeholder="새 비밀번호 확인"
                            value={formData.confirmPassword}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, confirmPassword: text }));
                                setErrors(prev => ({ ...prev, confirmPassword: '' }));
                            }}
                            secureTextEntry={!showConfirmPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={loading}
                        >
                            <Ionicons
                                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                size={20}
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}

                    <TouchableOpacity
                        style={[styles.resetButton, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.resetButtonText}>비밀번호 변경</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    formContainer: {
        padding: 20,
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
    inputError: {
        borderColor: '#FF3B30'
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
        marginLeft: 15
    },
    resetButton: {
        backgroundColor: '#0066FF',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.5
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default ResetPasswordScreen;