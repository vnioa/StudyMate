import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { feedbackAPI } from '../../services/api';

const StudyFeedbackScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('self');
    const [isSelfEvalModalVisible, setSelfEvalModalVisible] = useState(false);
    const [isJournalModalVisible, setJournalModalVisible] = useState(false);

    const [selfEvaluation, setSelfEvaluation] = useState({
        understanding: 3,
        effort: 3,
        efficiency: 3,
        notes: ''
    });

    const [studyJournal, setStudyJournal] = useState({
        date: new Date().toISOString().split('T')[0],
        content: '',
        achievements: '',
        difficulties: ''
    });

    useEffect(() => {
        fetchFeedbackData();
    }, []);

    const fetchFeedbackData = async () => {
        try {
            setLoading(true);
            const response = await feedbackAPI.getFeedback();
            setSelfEvaluation(response.data.selfEvaluation);
            setStudyJournal(response.data.studyJournal);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '피드백 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSelfEvaluation = async () => {
        try {
            setLoading(true);
            const response = await feedbackAPI.saveSelfEvaluation(selfEvaluation);
            if (response.data.success) {
                setSelfEvalModalVisible(false);
                Alert.alert('성공', '자기 평가가 저장되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '자기 평가 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveJournal = async () => {
        try {
            setLoading(true);
            const response = await feedbackAPI.saveJournal(studyJournal);
            if (response.data.success) {
                setJournalModalVisible(false);
                Alert.alert('성공', '학습 일지가 저장되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '학습 일지 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const RatingStars = ({ rating, setRating, label }) => (
        <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>{label}</Text>
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                        key={star}
                        onPress={() => setRating(star)}
                        disabled={loading}
                    >
                        <Icon
                            name={star <= rating ? 'star' : 'star'}
                            size={24}
                            color={star <= rating ? '#FFD700' : '#ddd'}
                        />
                    </Pressable>
                ))}
            </View>
        </View>
    );

    if (loading && !selfEvaluation.notes) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header and other components remain the same... */}

            <ScrollView style={styles.content}>
                {/* Self Evaluation Section */}
                <Pressable
                    style={styles.feedbackCard}
                    onPress={() => setSelfEvalModalVisible(true)}
                    disabled={loading}
                >
                    <View style={styles.cardHeader}>
                        <Icon name="user" size={24} color="#4A90E2" />
                        <Text style={styles.cardTitle}>자기 평가</Text>
                    </View>
                    <Text style={styles.cardDescription}>
                        오늘의 학습을 스스로 평가해보세요
                    </Text>
                </Pressable>

                {/* Study Journal Section */}
                <Pressable
                    style={styles.feedbackCard}
                    onPress={() => setJournalModalVisible(true)}
                    disabled={loading}
                >
                    <View style={styles.cardHeader}>
                        <Icon name="book" size={24} color="#4A90E2" />
                        <Text style={styles.cardTitle}>학습 일지</Text>
                    </View>
                    <Text style={styles.cardDescription}>
                        오늘의 학습 내용을 기록해보세요
                    </Text>
                </Pressable>

                {/* Modals and other components remain the same... */}
            </ScrollView>
        </View>
    );
};

// Styles remain the same...

export default StudyFeedbackScreen;