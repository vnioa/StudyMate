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

const CreateQuestionScreen = memo(({ navigation }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        title: '',
        content: ''
    });

    const validateForm = useCallback(() => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = '제목을 입력해주세요';
        } else if (formData.title.length < 5) {
            newErrors.title = '제목은 최소 5자 이상 입력해주세요';
        }

        if (!formData.content.trim()) {
            newErrors.content = '내용을 입력해주세요';
        } else if (formData.content.length < 20) {
            newErrors.content = '내용은 최소 20자 이상 입력해주세요';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            await communityAPI.validateQuestion(formData);
            await communityAPI.createQuestion({
                title: formData.title.trim(),
                content: formData.content.trim()
            });

            Alert.alert(
                '성공',
                '질문이 등록되었습니다',
                [{ text: '확인', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '질문 등록에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBack = useCallback(() => {
        if (formData.title.trim() || formData.content.trim()) {
            Alert.alert(
                '작성 취소',
                '작성 중인 내용이 있습니다. 정말 나가시겠습니까?',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '나가기',
                        style: 'destructive',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } else {
            navigation.goBack();
        }
    }, [formData, navigation]);

    const updateFormField = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setErrors(prev => ({
            ...prev,
            [field]: ''
        }));
    }, []);

    const HeaderRight = memo(({ onPress, disabled }) => (
        <TouchableOpacity
            style={[
                styles.submitButton,
                disabled && styles.submitButtonDisabled
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            {loading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
                <Text style={styles.submitButtonText}>등록</Text>
            )}
        </TouchableOpacity>
    ));

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={theme.colors.text}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>질문하기</Text>
                <HeaderRight
                    onPress={handleSubmit}
                    disabled={loading || !formData.title.trim() || !formData.content.trim()}
                />
            </View>

            <ScrollView
                style={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[
                            styles.titleInput,
                            errors.title && styles.inputError
                        ]}
                        placeholder="제목을 입력하세요"
                        value={formData.title}
                        onChangeText={(text) => updateFormField('title', text)}
                        maxLength={100}
                        returnKeyType="next"
                        editable={!loading}
                    />
                    {errors.title ? (
                        <Text style={styles.errorText}>{errors.title}</Text>
                    ) : (
                        <Text style={styles.charCount}>
                            {formData.title.length}/100
                        </Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={[
                            styles.contentInput,
                            errors.content && styles.inputError
                        ]}
                        placeholder="질문 내용을 자세히 작성해주세요"
                        multiline
                        value={formData.content}
                        onChangeText={(text) => updateFormField('content', text)}
                        textAlignVertical="top"
                        editable={!loading}
                    />
                    {errors.content && (
                        <Text style={styles.errorText}>{errors.content}</Text>
                    )}
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
        backgroundColor: theme.colors.surface,
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
        minWidth: 60,
        alignItems: 'center',
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
    titleInput: {
        ...theme.typography.bodyLarge,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingVertical: theme.spacing.sm,
        marginBottom: 4,
        color: theme.colors.text,
    },
    contentInput: {
        ...theme.typography.bodyMedium,
        height: 300,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.sm,
        marginBottom: 4,
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
        color: theme.colors.textSecondary,
        ...theme.typography.bodySmall,
        textAlign: 'right',
    },
});

CreateQuestionScreen.displayName = 'CreateQuestionScreen';

export default CreateQuestionScreen;