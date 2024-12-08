import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const BASE_URL = 'http://121.127.165.43:3000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const RegisterMentorScreen = memo(({ navigation }) => {
    const [formData, setFormData] = useState({
        field: '',
        experience: '',
        introduction: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isOnline, setIsOnline] = useState(true);

    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    const checkNetwork = async () => {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            setIsOnline(false);
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }
        setIsOnline(true);
        return true;
    };

    const validateForm = useCallback(() => {
        const newErrors = {};

        if (!formData.field.trim()) {
            newErrors.field = '전문 분야를 입력해주세요';
        }

        if (!formData.experience.trim()) {
            newErrors.experience = '경력을 입력해주세요';
        }

        if (!formData.introduction.trim()) {
            newErrors.introduction = '자기소개를 입력해주세요';
        } else if (formData.introduction.length < 50) {
            newErrors.introduction = '자기소개는 최소 50자 이상 입력해주세요';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = async () => {
        if (!validateForm() || !(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.post('/api/mentors/register', formData);

            if (response.data.success) {
                await AsyncStorage.setItem('mentorRegistration',
                    JSON.stringify(formData));

                Alert.alert(
                    '성공',
                    '멘토 등록이 완료되었습니다',
                    [{ text: '확인', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '멘토 등록에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    };

    const updateFormField = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
    }, []);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>멘토 등록</Text>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (loading || !isOnline) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={loading || !isOnline}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                        <Text style={[
                            styles.submitButtonText,
                            !isOnline && styles.textDisabled
                        ]}>등록</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>전문 분야</Text>
                    <TextInput
                        style={[
                            styles.input,
                            errors.field && styles.inputError,
                            !isOnline && styles.inputDisabled
                        ]}
                        placeholder="예: React Native, JavaScript"
                        value={formData.field}
                        onChangeText={(text) => updateFormField('field', text)}
                        maxLength={50}
                        editable={!loading && isOnline}
                    />
                    {errors.field && (
                        <Text style={styles.errorText}>{errors.field}</Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>경력</Text>
                    <TextInput
                        style={[
                            styles.input,
                            errors.experience && styles.inputError,
                            !isOnline && styles.inputDisabled
                        ]}
                        placeholder="예: 5년차 프론트엔드 개발자"
                        value={formData.experience}
                        onChangeText={(text) => updateFormField('experience', text)}
                        maxLength={100}
                        editable={!loading && isOnline}
                    />
                    {errors.experience && (
                        <Text style={styles.errorText}>{errors.experience}</Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>자기소개</Text>
                    <TextInput
                        style={[
                            styles.textArea,
                            errors.introduction && styles.inputError,
                            !isOnline && styles.inputDisabled
                        ]}
                        placeholder="멘티들에게 본인을 소개해주세요"
                        value={formData.introduction}
                        onChangeText={(text) => updateFormField('introduction', text)}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        maxLength={500}
                        editable={!loading && isOnline}
                    />
                    {errors.introduction && (
                        <Text style={styles.errorText}>{errors.introduction}</Text>
                    )}
                    <Text style={styles.charCount}>
                        {formData.introduction.length}/500
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    submitButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.roundness.large,
    },
    submitButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },
    submitButtonText: {
        color: theme.colors.white,
        ...theme.typography.bodyMedium,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: theme.spacing.md,
    },
    inputContainer: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
        fontWeight: '500',
    },
    input: {
        ...theme.typography.bodyMedium,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.sm,
        color: theme.colors.text,
        backgroundColor: theme.colors.surface,
    },
    textArea: {
        ...theme.typography.bodyMedium,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.sm,
        minHeight: 120,
        color: theme.colors.text,
        backgroundColor: theme.colors.surface,
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    errorText: {
        color: theme.colors.error,
        ...theme.typography.bodySmall,
        marginTop: 4,
    },
    charCount: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        textAlign: 'right',
        marginTop: 4,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    },
    inputDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    }
});

RegisterMentorScreen.displayName = 'RegisterMentorScreen';

export default RegisterMentorScreen;