import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { settingsAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageScreen = () => {
    const navigation = useNavigation();
    const [selectedLanguage, setSelectedLanguage] = useState('ko');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCurrentLanguage();
    }, []);

    const fetchCurrentLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('language');
            if (savedLanguage) {
                setSelectedLanguage(savedLanguage);
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
        }
    };

    const handleLanguageChange = async (language) => {
        if (language === selectedLanguage) return;

        try {
            setLoading(true);
            const response = await settingsAPI.updateLanguage(language);

            if (response.data.success) {
                await AsyncStorage.setItem('language', language);
                setSelectedLanguage(language);
                Alert.alert('알림', '언어가 변경되었습니다. 앱을 다시 시작해주세요.');
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '언어 설정 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const languages = [
        { code: 'ko', name: '한국어' },
        { code: 'en', name: 'English' }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>언어</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
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
                            {language.code === 'en' && (
                                <Text style={styles.description}>
                                    Change language to English
                                </Text>
                            )}
                        </View>
                        <View style={[
                            styles.radio,
                            selectedLanguage === language.code && styles.radioSelected
                        ]} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectedOption: {
        backgroundColor: '#f8f9fa',
        borderColor: '#0066FF',
    },
    languageInfo: {
        flex: 1,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
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
        borderColor: '#0066FF',
        backgroundColor: '#0066FF',
    },
});

export default LanguageScreen;