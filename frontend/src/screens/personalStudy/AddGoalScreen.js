import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { goalAPI } from '../../services/api';

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

    const validateForm = () => {
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
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const response = await goalAPI.createGoal(goalData);

            if (response.data.success) {
                Alert.alert('성공', '새로운 목표가 생성되었습니다.', [
                    { text: '확인', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '목표 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setGoalData(prev => ({ ...prev, deadline: selectedDate }));
            if (errors.deadline) {
                setErrors(prev => ({ ...prev, deadline: '' }));
            }
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="x" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>새로운 목표</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
                        저장
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.label}>목표 제목</Text>
                    <TextInput
                        style={[styles.input, errors.title && styles.inputError]}
                        placeholder="목표를 입력해주세요"
                        value={goalData.title}
                        onChangeText={(text) => {
                            setGoalData(prev => ({ ...prev, title: text }));
                            if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                        }}
                    />
                    {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>목표 기간</Text>
                    <View style={styles.categoryContainer}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.categoryButton,
                                    goalData.category === category.id && styles.categoryButtonActive,
                                ]}
                                onPress={() => setGoalData(prev => ({ ...prev, category: category.id }))}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    goalData.category === category.id && styles.categoryTextActive,
                                ]}>
                                    {category.label}
                                </Text>
                                <Text style={[
                                    styles.categoryDescription,
                                    goalData.category === category.id && styles.categoryTextActive,
                                ]}>
                                    {category.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>목표 기한</Text>
                    <TouchableOpacity
                        style={[styles.dateButton, errors.deadline && styles.inputError]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateText}>
                            {goalData.deadline.toLocaleDateString()}
                        </Text>
                        <Icon name="calendar" size={20} color="#666" />
                    </TouchableOpacity>
                    {errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>상세 설명</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                        placeholder="목표에 대한 상세 설명을 입력해주세요"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={goalData.description}
                        onChangeText={(text) => {
                            setGoalData(prev => ({ ...prev, description: text }));
                            if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                        }}
                    />
                    {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
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

// styles 객체는 기존과 동일하게 유지하되 다음 스타일 추가:
const additionalStyles = {
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    saveButtonDisabled: {
        opacity: 0.5
    },
    inputError: {
        borderColor: '#FF3B30'
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4
    }
};

export default AddGoalScreen;