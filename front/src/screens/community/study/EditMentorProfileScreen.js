import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mentorAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

const EditMentorProfileScreen = ({ navigation, route }) => {
    const { mentorId, currentData } = route.params;
    const [formData, setFormData] = useState({
        field: currentData.field || '',
        experience: currentData.experience || '',
        introduction: currentData.introduction || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        try {
            setLoading(true);
            await mentorAPI.updateMentorInfo(mentorId, formData);
            Alert.alert('성공', '멘토 정보가 수정되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('오류', error.message || '멘토 정보 수정에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>프로필 수정</Text>
                <TouchableOpacity 
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveButton}>저장</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>전문 분야</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.field}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, field: text }))}
                        placeholder="전문 분야를 입력하세요"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>경력</Text>
                    <TextInput
                        style={[styles.input, styles.multilineInput]}
                        value={formData.experience}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, experience: text }))}
                        placeholder="경력을 입력하세요"
                        multiline
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>자기소개</Text>
                    <TextInput
                        style={[styles.input, styles.multilineInput]}
                        value={formData.introduction}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, introduction: text }))}
                        placeholder="자기소개를 입력하세요"
                        multiline
                    />
                </View>
            </ScrollView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            )}
        </View>
    );
};

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
    saveButton: {
        color: theme.colors.primary,
        ...theme.typography.bodyLarge,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: theme.spacing.md,
    },
    inputGroup: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.small,
        padding: theme.spacing.sm,
        ...theme.typography.bodyMedium,
    },
    multilineInput: {
        height: 120,
        textAlignVertical: 'top',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default EditMentorProfileScreen; 