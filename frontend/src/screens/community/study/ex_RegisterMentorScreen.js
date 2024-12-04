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
import { communityAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

const RegisterMentorScreen = memo(({ navigation }) => {
    const [formData, setFormData] = useState({
        field: '',
        experience: '',
        introduction: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

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
        if (!validateForm()) return;

        try {
            setLoading(true);
            await communityAPI.registerMentor(formData);
            Alert.alert(
                '성공',
                '멘토 등록이 완료되었습니다',
                [{ text: '확인', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert('오류', error.message || '멘토 등록에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>멘토 등록</Text>
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                        <Text style={styles.submitButtonText}>등록</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>전문 분야</Text>
                    <TextInput
                        style={[styles.input, errors.field && styles.inputError]}
                        placeholder="예: React Native, JavaScript"
                        value={formData.field}
                        onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, field: text }));
                            setErrors(prev => ({ ...prev, field: '' }));
                        }}
                        maxLength={50}
                    />
                    {errors.field && (
                        <Text style={styles.errorText}>{errors.field}</Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>경력</Text>
                    <TextInput
                        style={[styles.input, errors.experience && styles.inputError]}
                        placeholder="예: 5년차 프론트엔드 개발자"
                        value={formData.experience}
                        onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, experience: text }));
                            setErrors(prev => ({ ...prev, experience: '' }));
                        }}
                        maxLength={100}
                    />
                    {errors.experience && (
                        <Text style={styles.errorText}>{errors.experience}</Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>자기소개</Text>
                    <TextInput
                        style={[styles.textArea, errors.introduction && styles.inputError]}
                        placeholder="멘티들에게 본인을 소개해주세요"
                        value={formData.introduction}
                        onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, introduction: text }));
                            setErrors(prev => ({ ...prev, introduction: '' }));
                        }}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
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
        opacity: 0.5,
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
        borderRadius: theme.roundness.small,
        padding: theme.spacing.sm,
        color: theme.colors.text,
    },
    textArea: {
        ...theme.typography.bodyMedium,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.small,
        padding: theme.spacing.sm,
        minHeight: 120,
        color: theme.colors.text,
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
});

RegisterMentorScreen.displayName = 'RegisterMentorScreen';

export default RegisterMentorScreen;