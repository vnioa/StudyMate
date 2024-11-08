// src/screens/group/GroupCreateScreen.js

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import api from '../../services/api';

export default function GroupCreateScreen() {
    const navigation = useNavigation();

    // 폼 상태 관리
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'study', // study, project, club
        isPrivate: false,
        maxMembers: '20',
        coverImage: null,
        tags: [],
        rules: '',
        joinQuestions: []
    });

    // 유효성 검사 상태
    const [errors, setErrors] = useState({
        name: '',
        description: '',
        maxMembers: ''
    });

    // 태그 입력 상태
    const [tagInput, setTagInput] = useState('');

    // 가입 질문 입력 상태
    const [questionInput, setQuestionInput] = useState('');

    // 이미지 선택
    const handleImagePick = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('권한 필요', '이미지를 선택하기 위해 갤러리 접근 권한이 필요합니다.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                setFormData(prev => ({
                    ...prev,
                    coverImage: result.assets[0]
                }));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (error) {
            Alert.alert('오류', '이미지를 선택하는데 실패했습니다.');
        }
    };

    // 태그 추가
    const handleAddTag = () => {
        if (tagInput.trim() && formData.tags.length < 5) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    // 태그 삭제
    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 가입 질문 추가
    const handleAddQuestion = () => {
        if (questionInput.trim() && formData.joinQuestions.length < 3) {
            setFormData(prev => ({
                ...prev,
                joinQuestions: [...prev.joinQuestions, questionInput.trim()]
            }));
            setQuestionInput('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    // 가입 질문 삭제
    const handleRemoveQuestion = (index) => {
        setFormData(prev => ({
            ...prev,
            joinQuestions: prev.joinQuestions.filter((_, i) => i !== index)
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 입력값 유효성 검사
    const validateForm = () => {
        let isValid = true;
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = '그룹 이름을 입력해주세요';
            isValid = false;
        } else if (formData.name.length < 2 || formData.name.length > 20) {
            newErrors.name = '그룹 이름은 2-20자 사이여야 합니다';
            isValid = false;
        }

        if (!formData.description.trim()) {
            newErrors.description = '그룹 설명을 입력해주세요';
            isValid = false;
        }

        const maxMembers = parseInt(formData.maxMembers);
        if (isNaN(maxMembers) || maxMembers < 2 || maxMembers > 100) {
            newErrors.maxMembers = '최대 인원은 2-100명 사이여야 합니다';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // 그룹 생성
    const handleCreate = async () => {
        if (!validateForm()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        try {
            const formDataToSend = new FormData();

            // 기본 정보
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('type', formData.type);
            formDataToSend.append('isPrivate', formData.isPrivate);
            formDataToSend.append('maxMembers', formData.maxMembers);
            formDataToSend.append('rules', formData.rules);

            // 태그와 가입 질문
            formDataToSend.append('tags', JSON.stringify(formData.tags));
            formDataToSend.append('joinQuestions', JSON.stringify(formData.joinQuestions));

            // 커버 이미지
            if (formData.coverImage) {
                const imageUri = formData.coverImage.uri;
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image';

                formDataToSend.append('coverImage', {
                    uri: imageUri,
                    name: filename,
                    type
                });
            }

            const response = await api.group.createGroup(formDataToSend);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.replace('GroupDetail', { groupId: response.id });
        } catch (error) {
            Alert.alert('오류', '그룹 생성에 실패했습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.scrollView}>
                {/* 커버 이미지 */}
                <TouchableOpacity
                    style={styles.coverImageContainer}
                    onPress={handleImagePick}
                >
                    {formData.coverImage ? (
                        <Image
                            source={{ uri: formData.coverImage.uri }}
                            style={styles.coverImage}
                        />
                    ) : (
                        <View style={styles.coverImagePlaceholder}>
                            <Ionicons name="image-outline" size={48} color={theme.colors.text.secondary} />
                            <Text style={styles.coverImageText}>커버 이미지 선택</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* 기본 정보 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>그룹 이름</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.name && styles.inputError
                            ]}
                            value={formData.name}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, name: text }));
                                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                            }}
                            placeholder="그룹 이름 입력 (2-20자)"
                            maxLength={20}
                        />
                        {errors.name && (
                            <Text style={styles.errorText}>{errors.name}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>그룹 설명</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                errors.description && styles.inputError
                            ]}
                            value={formData.description}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, description: text }));
                                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                            }}
                            placeholder="그룹 설명 입력"
                            multiline
                            numberOfLines={4}
                        />
                        {errors.description && (
                            <Text style={styles.errorText}>{errors.description}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>그룹 유형</Text>
                        <View style={styles.typeButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    formData.type === 'study' && styles.typeButtonActive
                                ]}
                                onPress={() => {
                                    setFormData(prev => ({ ...prev, type: 'study' }));
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <Text style={[
                                    styles.typeButtonText,
                                    formData.type === 'study' && styles.typeButtonTextActive
                                ]}>
                                    스터디
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    formData.type === 'project' && styles.typeButtonActive
                                ]}
                                onPress={() => {
                                    setFormData(prev => ({ ...prev, type: 'project' }));
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <Text style={[
                                    styles.typeButtonText,
                                    formData.type === 'project' && styles.typeButtonTextActive
                                ]}>
                                    프로젝트
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    formData.type === 'club' && styles.typeButtonActive
                                ]}
                                onPress={() => {
                                    setFormData(prev => ({ ...prev, type: 'club' }));
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <Text style={[
                                    styles.typeButtonText,
                                    formData.type === 'club' && styles.typeButtonTextActive
                                ]}>
                                    동아리
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>최대 인원</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.maxMembers && styles.inputError
                            ]}
                            value={formData.maxMembers}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, maxMembers: text }));
                                if (errors.maxMembers) setErrors(prev => ({ ...prev, maxMembers: '' }));
                            }}
                            placeholder="최대 인원 입력 (2-100명)"
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                        {errors.maxMembers && (
                            <Text style={styles.errorText}>{errors.maxMembers}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>비공개 그룹</Text>
                            <TouchableOpacity
                                style={styles.privateToggle}
                                onPress={() => {
                                    setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }));
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <Ionicons
                                    name={formData.isPrivate ? "lock-closed" : "lock-open"}
                                    size={24}
                                    color={formData.isPrivate ? theme.colors.primary.main : theme.colors.text.secondary}
                                />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.description}>
                            비공개 그룹은 초대를 통해서만 가입할 수 있습니다.
                        </Text>
                    </View>
                </View>

                {/* 태그 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>태그</Text>
                    <View style={styles.tagInput}>
                        <TextInput
                            style={styles.input}
                            value={tagInput}
                            onChangeText={setTagInput}
                            placeholder="태그 입력 (최대 5개)"
                            onSubmitEditing={handleAddTag}
                            maxLength={20}
                        />
                        <TouchableOpacity
                            style={[
                                styles.tagAddButton,
                                (!tagInput.trim() || formData.tags.length >= 5) && styles.tagAddButtonDisabled
                            ]}
                            onPress={handleAddTag}
                            disabled={!tagInput.trim() || formData.tags.length >= 5}
                        >
                            <Text style={styles.tagAddButtonText}>추가</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.tags}>
                        {formData.tags.map((tag, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.tag}
                                onPress={() => handleRemoveTag(tag)}
                            >
                                <Text style={styles.tagText}>{tag}</Text>
                                <Ionicons name="close-circle" size={16} color="white" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 그룹 규칙 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>그룹 규칙</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.rules}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, rules: text }))}
                        placeholder="그룹 규칙을 입력해주세요"
                        multiline
                        numberOfLines={4}
                    />
                </View>

                {/* 가입 질문 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>가입 질문</Text>
                    <View style={styles.questionInput}>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={questionInput}
                            onChangeText={setQuestionInput}
                            placeholder="가입 시 질문할 내용을 입력해주세요 (최대 3개)"
                            multiline
                            numberOfLines={2}
                        />
                        <TouchableOpacity
                            style={[
                                styles.questionAddButton,
                                (!questionInput.trim() || formData.joinQuestions.length >= 3) &&
                                styles.questionAddButtonDisabled
                            ]}
                            onPress={handleAddQuestion}
                            disabled={!questionInput.trim() || formData.joinQuestions.length >= 3}
                        >
                            <Text style={styles.questionAddButtonText}>추가</Text>
                        </TouchableOpacity>
                    </View>
                    {formData.joinQuestions.map((question, index) => (
                        <View key={index} style={styles.questionItem}>
                            <Text style={styles.questionText}>{`${index + 1}. ${question}`}</Text>
                            <TouchableOpacity
                                style={styles.questionRemoveButton}
                                onPress={() => handleRemoveQuestion(index)}
                            >
                                <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* 생성 버튼 */}
            <View style={styles.bottomButtons}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreate}
                >
                    <Text style={styles.createButtonText}>생성하기</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    scrollView: {
        flex: 1,
    },
    coverImageContainer: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.background.secondary,
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    coverImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverImageText: {
        marginTop: theme.spacing.sm,
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
    },
    section: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    inputContainer: {
        marginBottom: theme.spacing.md,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    label: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    description: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.secondary,
    },
    input: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        padding: theme.spacing.md,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
    },
    inputError: {
        borderWidth: 1,
        borderColor: theme.colors.status.error,
    },
    errorText: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.status.error,
        marginTop: theme.spacing.xs,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    typeButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    typeButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.background.secondary,
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    typeButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    typeButtonTextActive: {
        color: theme.colors.text.contrast,
    },
    privateToggle: {
        padding: theme.spacing.sm,
    },
    tagInput: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    tagAddButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.primary.main,
        justifyContent: 'center',
    },
    tagAddButtonDisabled: {
        backgroundColor: theme.colors.grey[300],
    },
    tagAddButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary.main,
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 12,
        gap: 4,
    },
    tagText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    questionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    questionText: {
        flex: 1,
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.primary,
        marginRight: theme.spacing.sm,
    },
    questionRemoveButton: {
        padding: theme.spacing.xs,
    },
    bottomButtons: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background.primary,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        marginRight: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    createButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        marginLeft: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.primary.main,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    createButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    }
});