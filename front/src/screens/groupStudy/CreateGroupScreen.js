import React, { useState, useCallback, memo } from 'react';
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
    KeyboardAvoidingView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const CreateGroupScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'study',
        isPrivate: false,
        maxMembers: '20',
        coverImage: null,
        tags: [],
        rules: '',
        joinQuestions: []
    });
    const [errors, setErrors] = useState({});
    const [tagInput, setTagInput] = useState('');
    const [questionInput, setQuestionInput] = useState('');

    const handleImagePick = useCallback(async () => {
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
                setFormData(prev => ({...prev, coverImage: result.assets[0]}));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (error) {
            Alert.alert('오류', '이미지를 선택하는데 실패했습니다.');
        }
    }, []);

    const handleAddTag = useCallback(() => {
        if (tagInput.trim() && formData.tags.length < 5) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [tagInput, formData.tags]);

    const handleRemoveTag = useCallback((tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const handleAddQuestion = useCallback(() => {
        if (questionInput.trim() && formData.joinQuestions.length < 3) {
            setFormData(prev => ({
                ...prev,
                joinQuestions: [...prev.joinQuestions, questionInput.trim()]
            }));
            setQuestionInput('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [questionInput, formData.joinQuestions]);

    const handleRemoveQuestion = useCallback((index) => {
        setFormData(prev => ({
            ...prev,
            joinQuestions: prev.joinQuestions.filter((_, i) => i !== index)
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const validateForm = useCallback(() => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = '그룹 이름을 입력해주세요';
        } else if (formData.name.length < 2 || formData.name.length > 20) {
            newErrors.name = '그룹 이름은 2-20자 사이여야 합니다';
        }

        if (!formData.description.trim()) {
            newErrors.description = '그룹 설명을 입력해주세요';
        }

        const maxMembers = parseInt(formData.maxMembers);
        if (isNaN(maxMembers) || maxMembers < 2 || maxMembers > 100) {
            newErrors.maxMembers = '최대 인원은 2-100명 사이여야 합니다';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleCreate = useCallback(async () => {
        if (!validateForm()) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        try {
            setLoading(true);
            const formDataToSend = new FormData();

            Object.keys(formData).forEach(key => {
                if (key === 'coverImage') return;
                if (Array.isArray(formData[key])) {
                    formDataToSend.append(key, JSON.stringify(formData[key]));
                } else {
                    formDataToSend.append(key, formData[key]);
                }
            });

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

            const response = await groupAPI.createGroup(formDataToSend);

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                '성공',
                '그룹이 생성되었습니다.',
                [{
                    text: '확인',
                    onPress: () => navigation.replace('GroupDetail', {
                        groupId: response.groupId
                    })
                }]
            );
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '그룹 생성에 실패했습니다.'
            );
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, navigation]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView style={styles.scrollView}>
                <TouchableOpacity
                    style={styles.coverImageContainer}
                    onPress={handleImagePick}
                >
                    {formData.coverImage ? (
                        <Image
                            source={{uri: formData.coverImage.uri}}
                            style={styles.coverImage}
                        />
                    ) : (
                        <View style={styles.coverImagePlaceholder}>
                            <Ionicons
                                name="image-outline"
                                size={48}
                                color={theme.colors.textSecondary}
                            />
                            <Text style={styles.coverImageText}>
                                커버 이미지 선택
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

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
                                setFormData(prev => ({...prev, name: text}));
                                if (errors.name) {
                                    setErrors(prev => ({...prev, name: ''}));
                                }
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
                                setFormData(prev => ({...prev, description: text}));
                                if (errors.description) {
                                    setErrors(prev => ({...prev, description: ''}));
                                }
                            }}
                            placeholder="그룹 설명 입력"
                            multiline
                            numberOfLines={4}
                        />
                        {errors.description && (
                            <Text style={styles.errorText}>
                                {errors.description}
                            </Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>그룹 유형</Text>
                        <View style={styles.typeButtons}>
                            {['study', 'project', 'club'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeButton,
                                        formData.type === type && styles.typeButtonActive
                                    ]}
                                    onPress={() => {
                                        setFormData(prev => ({...prev, type}));
                                        Haptics.impactAsync(
                                            Haptics.ImpactFeedbackStyle.Light
                                        );
                                    }}
                                >
                                    <Text style={[
                                        styles.typeButtonText,
                                        formData.type === type && styles.typeButtonTextActive
                                    ]}>
                                        {type === 'study' ? '스터디' :
                                            type === 'project' ? '프로젝트' : '동아리'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
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
                                setFormData(prev => ({...prev, maxMembers: text}));
                                if (errors.maxMembers) {
                                    setErrors(prev => ({...prev, maxMembers: ''}));
                                }
                            }}
                            placeholder="최대 인원 입력 (2-100명)"
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                        {errors.maxMembers && (
                            <Text style={styles.errorText}>
                                {errors.maxMembers}
                            </Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>비공개 그룹</Text>
                            <TouchableOpacity
                                style={styles.privateToggle}
                                onPress={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        isPrivate: !prev.isPrivate
                                    }));
                                    Haptics.impactAsync(
                                        Haptics.ImpactFeedbackStyle.Light
                                    );
                                }}
                            >
                                <Ionicons
                                    name={formData.isPrivate ? "lock-closed" : "lock-open"}
                                    size={24}
                                    color={formData.isPrivate ?
                                        theme.colors.primary :
                                        theme.colors.textSecondary
                                    }
                                />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.description}>
                            비공개 그룹은 초대를 통해서만 가입할 수 있습니다.
                        </Text>
                    </View>
                </View>

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
                                (!tagInput.trim() || formData.tags.length >= 5) &&
                                styles.tagAddButtonDisabled
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
                                <Ionicons
                                    name="close-circle"
                                    size={16}
                                    color={theme.colors.white}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>그룹 규칙</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.rules}
                        onChangeText={(text) =>
                            setFormData(prev => ({...prev, rules: text}))
                        }
                        placeholder="그룹 규칙을 입력해주세요"
                        multiline
                        numberOfLines={4}
                    />
                </View>

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
                            <Text style={styles.questionText}>
                                {`${index + 1}. ${question}`}
                            </Text>
                            <TouchableOpacity
                                style={styles.questionRemoveButton}
                                onPress={() => handleRemoveQuestion(index)}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={20}
                                    color={theme.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.bottomButtons}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.createButton,
                        loading && styles.createButtonDisabled
                    ]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={theme.colors.white}/>
                    ) : (
                        <Text style={styles.createButtonText}>생성하기</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
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
    scrollView: {
        flex: 1,
    },
    coverImageContainer: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.surface,
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
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    section: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
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
        ...theme.typography.bodyMedium,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    description: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.md,
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    inputError: {
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    errorText: {
        ...theme.typography.bodySmall,
        color: theme.colors.error,
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
        borderRadius: theme.roundness.medium,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    typeButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    typeButtonTextActive: {
        color: theme.colors.white,
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
        borderRadius: theme.roundness.medium,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
    },
    tagAddButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },
    tagAddButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.white,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.roundness.full,
        paddingVertical: 4,
        paddingHorizontal: 12,
        gap: 4,
    },
    tagText: {
        ...theme.typography.bodySmall,
        color: theme.colors.white,
    },
    questionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    questionText: {
        flex: 1,
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
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
        backgroundColor: theme.colors.surface,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        marginRight: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    createButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        marginLeft: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
    },
    cancelButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    createButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
    }
});

CreateGroupScreen.displayName = 'CreateGroupScreen';
export default memo(CreateGroupScreen);