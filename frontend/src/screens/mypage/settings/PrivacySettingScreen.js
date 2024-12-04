import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { settingsAPI } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PrivacySettingScreen = () => {
    const navigation = useNavigation();
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [settings, setSettings] = useState({
        isPublic: true,
        allowMessages: true,
        showActivity: true,
        showProgress: true
    });

    useEffect(() => {
        fetchPrivacySettings();
    }, []);

    const fetchPrivacySettings = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getPrivacySettings();
            if (response.data) {
                setSettings(response.data);
                setIsPublic(response.data.isPublic);
                await AsyncStorage.setItem('privacySettings', JSON.stringify(response.data));
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
            const cachedSettings = await AsyncStorage.getItem('privacySettings');
            if (cachedSettings) {
                const parsed = JSON.parse(cachedSettings);
                setSettings(parsed);
                setIsPublic(parsed.isPublic);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePrivacyChange = (value) => {
        setIsPublic(value);
        setSettings(prev => ({...prev, isPublic: value}));
        setHasChanges(true);
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({...prev, [key]: value}));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!hasChanges) {
            navigation.goBack();
            return;
        }

        try {
            setLoading(true);
            const response = await settingsAPI.updatePrivacySettings(settings);

            if (response.data.success) {
                await AsyncStorage.setItem('privacySettings', JSON.stringify(settings));
                Alert.alert('성공', '개인정보 설정이 변경되었습니다.', [
                    { text: '확인', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('오류', '설정 변경에 실패했습니다.');
            setSettings(prev => ({...prev, isPublic: !isPublic}));
        } finally {
            setLoading(false);
        }
    };

    const renderOption = (title, description, value, onPress) => (
        <TouchableOpacity
            style={styles.optionItem}
            onPress={onPress}
            disabled={loading}
        >
            <View style={styles.optionContent}>
                <Text style={styles.optionText}>{title}</Text>
                <Text style={styles.optionDescription}>{description}</Text>
            </View>
            <View style={[styles.radio, value && styles.radioSelected]} />
        </TouchableOpacity>
    );

    if (loading && !settings.isPublic) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="x" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>계정 공개 범위</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading || !hasChanges}
                >
                    <Text style={[
                        styles.saveButton,
                        (loading || !hasChanges) && styles.saveButtonDisabled
                    ]}>완료</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchPrivacySettings}
                        colors={['#4A90E2']}
                    />
                }
            >
                <Text style={styles.description}>
                    계정을 공개 또는 비공개로 설정할 수 있습니다. 공개 설정한 경우 모든 사람의 정보를 볼 수 있습니다.{'\n\n'}
                    비공개 상태인 경우 외부인이 승인한 사람만 정보를 볼 수 있습니다.
                </Text>

                {renderOption(
                    '공개',
                    '모든 사용자가 프로필을 볼 수 있습니다',
                    isPublic,
                    () => handlePrivacyChange(true)
                )}

                {renderOption(
                    '비공개',
                    '승인된 사용자만 프로필을 볼 수 있습니다',
                    !isPublic,
                    () => handlePrivacyChange(false)
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>추가 설정</Text>
                    {renderOption(
                        '메시지 허용',
                        '다른 사용자의 메시지를 받습니다',
                        settings.allowMessages,
                        () => handleSettingChange('allowMessages', !settings.allowMessages)
                    )}
                    {renderOption(
                        '활동 표시',
                        '나의 학습 활동을 다른 사용자에게 표시합니다',
                        settings.showActivity,
                        () => handleSettingChange('showActivity', !settings.showActivity)
                    )}
                    {renderOption(
                        '진도율 표시',
                        '나의 학습 진도율을 다른 사용자에게 표시합니다',
                        settings.showProgress,
                        () => handleSettingChange('showProgress', !settings.showProgress)
                    )}
                </View>
            </ScrollView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        color: '#4A90E2',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    content: {
        flex: 1,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 24,
        padding: 16,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    optionContent: {
        flex: 1,
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
        color: '#333',
    },
    optionDescription: {
        fontSize: 14,
        color: '#666',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    radioSelected: {
        borderColor: '#4A90E2',
        backgroundColor: '#4A90E2',
    }
});

export default PrivacySettingScreen;