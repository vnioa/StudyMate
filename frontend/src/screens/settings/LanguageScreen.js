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
import { settingsAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';

const LanguageScreen = () => {
    const navigation = useNavigation();
    const [selectedLanguage, setSelectedLanguage] = useState('ko');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [systemLanguage, setSystemLanguage] = useState('');

    useEffect(() => {
        fetchInitialData();
        const deviceLanguage = RNLocalize.getLocales()[0].languageCode;
        setSystemLanguage(deviceLanguage);
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getLanguageSettings();
            if (response.data) {
                setSelectedLanguage(response.data.language);
                await AsyncStorage.setItem('language', response.data.language);
            } else {
                const savedLanguage = await AsyncStorage.getItem('language');
                if (savedLanguage) {
                    setSelectedLanguage(savedLanguage);
                }
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLanguageChange = async (language) => {
        if (language === selectedLanguage) return;

        Alert.alert(
            '언어 변경',
            '언어를 변경하시겠습니까? 앱이 다시 시작됩니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '변경',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const response = await settingsAPI.updateLanguage({
                                language,
                                updateGlobally: true
                            });

                            if (response.data.success) {
                                await AsyncStorage.setItem('language', language);
                                setSelectedLanguage(language);

                                // 앱 전체 언어 설정 변경
                                await settingsAPI.applyLanguageGlobally(language);
                                Alert.alert('성공', '언어가 변경되었습니다.', [
                                    {
                                        text: '확인',
                                        onPress: () => RNLocalize.forceRTL(language === 'ar')
                                    }
                                ]);
                            }
                        } catch (error) {
                            Alert.alert('오류', '언어 설정 변경에 실패했습니다.');
                            const savedLanguage = await AsyncStorage.getItem('language');
                            if (savedLanguage) {
                                setSelectedLanguage(savedLanguage);
                            }
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const languages = [
        { code: 'ko', name: '한국어', description: '한국어로 표시됩니다' },
        { code: 'en', name: 'English', description: 'Display in English' },
        { code: 'ja', name: '日本語', description: '日本語で表示されます' },
        { code: 'zh', name: '中文', description: '以中文显示' }
    ];

    if (loading && !selectedLanguage) {
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
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>언어 설정</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchInitialData}
                        colors={['#4A90E2']}
                    />
                }
            >
                <Text style={styles.sectionTitle}>시스템 언어</Text>
                <View style={styles.systemLanguageContainer}>
                    <Text style={styles.systemLanguageText}>
                        {languages.find(l => l.code === systemLanguage)?.name || 'English'}
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>앱 언어</Text>
                {languages.map((language) => (
                    <TouchableOpacity
                        key={language.code}
                        style={[
                            styles.option,
                            selectedLanguage === language.code && styles.selectedOption
                        ]}
                        onPress={() => handleLanguageChange(language.code)}
                        disabled={loading}
                    >
                        <View style={styles.languageInfo}>
                            <Text style={styles.optionText}>{language.name}</Text>
                            <Text style={styles.description}>
                                {language.description}
                            </Text>
                        </View>
                        <View style={[
                            styles.radio,
                            selectedLanguage === language.code && styles.radioSelected
                        ]} />
                    </TouchableOpacity>
                ))}
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
    content: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginTop: 16,
    },
    systemLanguageContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#eee',
    },
    systemLanguageText: {
        fontSize: 16,
        color: '#666',
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    selectedOption: {
        backgroundColor: '#f8f9fa',
        borderColor: '#4A90E2',
    },
    languageInfo: {
        flex: 1,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
        color: '#333',
    },
    description: {
        fontSize: 12,
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
    },
});

export default LanguageScreen;