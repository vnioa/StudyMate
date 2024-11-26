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

const EditGoalScreen = ({ route, navigation }) => {
    const { goalId } = route.params;
    const [loading, setLoading] = useState(false);
    const [goalData, setGoalData] = useState({
        title: '',
        category: 'short',
        deadline: new Date(),
        description: '',
        progress: 0
    });
    const [errors, setErrors] = useState({});
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchGoalData();
    }, [goalId]);

    const fetchGoalData = async () => {
        try {
            setLoading(true);
            const response = await goalAPI.getGoalDetails(goalId);
            setGoalData({
                ...response.data,
                deadline: new Date(response.data.deadline)
            });
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '목표 정보를 불러오는데 실패했습니다.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

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

    const handleUpdate = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const response = await goalAPI.updateGoal(goalId, goalData);

            if (response.data.success) {
                Alert.alert('성공', '목표가 수정되었습니다.', [
                    { text: '확인', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '목표 수정에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleProgressUpdate = async (value) => {
        try {
            const response = await goalAPI.updateGoalProgress(goalId, value);
            if (response.data.success) {
                setGoalData(prev => ({
                    ...prev,
                    progress: value
                }));
            }
        } catch (error) {
            Alert.alert('오류', '진행률 업데이트에 실패했습니다.');
        }
    };

    if (loading && !goalData.title) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    // Return JSX remains mostly the same, just add error displays and loading states
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="x" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>목표 수정</Text>
                <TouchableOpacity onPress={handleUpdate} disabled={loading}>
                    <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
                        완료
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Progress Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>현재 진행률</Text>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progress, { width: `${goalData.progress * 100}%` }]} />
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                const newProgress = Math.min(1, goalData.progress + 0.1);
                                handleProgressUpdate(newProgress);
                            }}
                        >
                            <Text style={styles.progressText}>{`${Math.round(goalData.progress * 100)}%`}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Rest of the form fields with error displays */}
                {/* ... existing JSX code ... */}
            </ScrollView>

            {showDatePicker && (
                <DateTimePicker
                    value={goalData.deadline}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            setGoalData(prev => ({ ...prev, deadline: selectedDate }));
                            if (errors.deadline) {
                                setErrors(prev => ({ ...prev, deadline: '' }));
                            }
                        }
                    }}
                    minimumDate={new Date()}
                />
            )}
        </View>
    );
};

// Add these styles to your existing styles
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

export default EditGoalScreen;