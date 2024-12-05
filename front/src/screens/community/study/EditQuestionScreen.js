import React, { useState, useCallback, memo, useEffect } from 'react';
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

const EditQuestionScreen = memo(({ route, navigation }) => {
    const { questionId } = route.params;
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({
        title: '',
        content: ''
    });

    // 기존 질문 정보 불러오기
    useEffect(() => {
        const fetchQuestionDetail = async () => {
            try {
                const response = await communityAPI.getQuestion(questionId);
                setFormData({
                    title: response.question.title,
                    content: response.question.content
                });
            } catch (error) {
                Alert.alert(
                    '오류',
                    error.message || '질문을 불러오는데 실패했습니다'
                );
                navigation.goBack();
            } finally {
                setInitialLoading(false);
            }
        };

        fetchQuestionDetail();
    }, [questionId]);

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
            await communityAPI.updateQuestion(questionId, {
                title: formData.title.trim(),
                content: formData.content.trim()
            });

            Alert.alert(
                '성공',
                '질문이 수정되었습니다',
                [{ text: '확인', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '질문 수정에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBack = useCallback(() => {
        Alert.alert(
            '수정 취소',
            '변경사항이 저장되지 않습니다. 나가시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '나가기',
                    style: 'destructive',
                    onPress: () => navigation.goBack()
                }
            ]
        );
    }, [navigation]);

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

    if (initialLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

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
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>질문 수정</Text>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (loading || !formData.title.trim() || !formData.content.trim()) && 
                        styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={loading || !formData.title.trim() || !formData.content.trim()}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                        <Text style={styles.submitButtonText}>수정</Text>
                    )}
                </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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

EditQuestionScreen.displayName = 'EditQuestionScreen';

export default EditQuestionScreen; 