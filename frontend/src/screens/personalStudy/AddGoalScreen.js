// AddGoalScreen.js

import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { goalAPI } from '../../services/api';
import { theme } from '../../styles/theme';

// 카테고리 버튼 컴포넌트
const CategoryButton = memo(({ category, isSelected, onPress }) => (
    <TouchableOpacity
        style={[
            styles.categoryButton,
            isSelected && styles.categoryButtonActive
        ]}
        onPress={onPress}
    >
        <Text style={[
            styles.categoryText,
            isSelected && styles.categoryTextActive
        ]}>
            {category.label}
        </Text>
        <Text style={[
            styles.categoryDescription,
            isSelected && styles.categoryTextActive
        ]}>
            {category.description}
        </Text>
    </TouchableOpacity>
));

const AddGoalScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [goalData, setGoalData] = useState({
        title: '',
        category: 'short',
        deadline: new Date(),
        description: ''
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errors, setErrors] = useState({});

    const categories = [
        { id: 'short', label: '단기 목표', description: '1주일 ~ 1개월' },
        { id: 'mid', label: '중기 목표', description: '1개월 ~ 6개월' },
        { id: 'long', label: '장기 목표', description: '6개월 이상' }
    ];

    // 폼 유효성 검사
    const validateForm = useCallback(() => {
        const newErrors = {};

        if (!goalData.title.trim()) {
            newErrors.title = '목표 제목을 입력해주세요';
        }

        if (!goalData.description.trim()) {
            newErrors.description = '목표 설명을 입력해주세요';
        }

        const today = new Date();
        if (goalData.deadline < today) {
            newErrors.deadline = '목표 기한은 오늘 이후여야 합니다';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [goalData]);

    // 목표 저장
    const handleSave = useCallback(async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const response = await goalAPI.createGoal({
                ...goalData,
                deadline: goalData.deadline.toISOString()
            });

            if (response.success) {
                Alert.alert(
                    '성공',
                    '새로운 목표가 생성되었습니다',
                    [{
                        text: '확인',
                        onPress: () => navigation.goBack()
                    }]
                );
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '목표 생성에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [goalData, validateForm, navigation]);

    // 날짜 선택 처리
    const handleDateChange = useCallback((event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setGoalData(prev => ({ ...prev, deadline: selectedDate }));
            if (errors.deadline) {
                setErrors(prev => ({ ...prev, deadline: '' }));
            }
        }
    }, [errors.deadline]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="x" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>새로운 목표</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={[
                        styles.saveButton,
                        loading && styles.saveButtonDisabled
                    ]}>
                        저장
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.label}>목표 제목</Text>
                    <TextInput
                        style={[
                            styles.input,
                            errors.title && styles.inputError
                        ]}
                        placeholder="목표를 입력해주세요"
                        value={goalData.title}
                        onChangeText={(text) => {
                            setGoalData(prev => ({ ...prev, title: text }));
                            if (errors.title) {
                                setErrors(prev => ({ ...prev, title: '' }));
                            }
                        }}
                    />
                    {errors.title && (
                        <Text style={styles.errorText}>{errors.title}</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>목표 기간</Text>
                    <View style={styles.categoryContainer}>
                        {categories.map((category) => (
                            <CategoryButton
                                key={category.id}
                                category={category}
                                isSelected={goalData.category === category.id}
                                onPress={() => setGoalData(prev => ({
                                    ...prev,
                                    category: category.id
                                }))}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>목표 기한</Text>
                    <TouchableOpacity
                        style={[
                            styles.dateButton,
                            errors.deadline && styles.inputError
                        ]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateText}>
                            {goalData.deadline.toLocaleDateString()}
                        </Text>
                        <Icon
                            name="calendar"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
                    {errors.deadline && (
                        <Text style={styles.errorText}>{errors.deadline}</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>상세 설명</Text>
                    <TextInput
                        style={[
                            styles.input,
                            styles.textArea,
                            errors.description && styles.inputError
                        ]}
                        placeholder="목표에 대한 상세 설명을 입력해주세요"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={goalData.description}
                        onChangeText={(text) => {
                            setGoalData(prev => ({ ...prev, description: text }));
                            if (errors.description) {
                                setErrors(prev => ({ ...prev, description: '' }));
                            }
                        }}
                    />
                    {errors.description && (
                        <Text style={styles.errorText}>{errors.description}</Text>
                    )}
                </View>
            </ScrollView>

            {showDatePicker && (
                <DateTimePicker
                    value={goalData.deadline}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                />
            )}
        </View>
    );
};

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
    saveButton: {
        ...theme.typography.bodyLarge,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    saveButtonDisabled: {
        color: theme.colors.disabled,
    },
    content: {
        flex: 1,
        padding: theme.spacing.md,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
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
    categoryContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    categoryButton: {
        flex: 1,
        padding: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
    },
    categoryButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    categoryText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginBottom: 4,
    },
    categoryTextActive: {
        color: theme.colors.white,
    },
    categoryDescription: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
    },
    dateText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    }
});

AddGoalScreen.displayName = 'AddGoalScreen';

export default memo(AddGoalScreen);