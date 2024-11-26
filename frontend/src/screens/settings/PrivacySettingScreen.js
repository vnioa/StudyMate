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

const PrivacySettingScreen = () => {
    const navigation = useNavigation();
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchPrivacySettings();
    }, []);

    const fetchPrivacySettings = async () => {
        try {
            const response = await settingsAPI.getPrivacySettings();
            setIsPublic(response.data.isPublic);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '설정을 불러오는데 실패했습니다.');
        }
    };

    const handlePrivacyChange = (value) => {
        setIsPublic(value);
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!hasChanges) {
            navigation.goBack();
            return;
        }

        try {
            setLoading(true);
            const response = await settingsAPI.updatePrivacySettings({
                isPublic
            });

            if (response.data.success) {
                await AsyncStorage.setItem('privacySettings', JSON.stringify({ isPublic }));
                Alert.alert('성공', '공개 범위가 변경되었습니다.', [
                    { text: '확인', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '설정 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="x" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>계정 공개 범위</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={[
                        styles.saveButton,
                        loading && styles.saveButtonDisabled
                    ]}>완료</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    계정을 공개 또는 비공개로 설정할 수 있습니다. 공개 설정한 경우 모든 사람의 정보를 볼 수 있습니다.{'\n\n'}
                    비공개 상태인 경우 외부인이 승인한 사람만 정보를 볼 수 있습니다.
                </Text>

                <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handlePrivacyChange(true)}
                    disabled={loading}
                >
                    <View style={styles.optionContent}>
                        <Text style={styles.optionText}>공개</Text>
                        <Text style={styles.optionDescription}>
                            모든 사용자가 프로필을 볼 수 있습니다
                        </Text>
                    </View>
                    <View style={[styles.radio, isPublic && styles.radioSelected]} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handlePrivacyChange(false)}
                    disabled={loading}
                >
                    <View style={styles.optionContent}>
                        <Text style={styles.optionText}>비공개</Text>
                        <Text style={styles.optionDescription}>
                            승인된 사용자만 프로필을 볼 수 있습니다
                        </Text>
                    </View>
                    <View style={[styles.radio, !isPublic && styles.radioSelected]} />
                </TouchableOpacity>
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButton: {
        color: '#0066FF',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    content: {
        padding: 20,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 30,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    optionContent: {
        flex: 1,
        marginRight: 15,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
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
        borderColor: '#0066FF',
        backgroundColor: '#0066FF',
    },
});

export default PrivacySettingScreen;