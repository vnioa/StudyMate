import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { settingsAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationDetailScreen = ({ route }) => {
    const { title, type } = route.params;
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        pushEnabled: true,
        emailEnabled: true
    });

    useEffect(() => {
        fetchNotificationSettings();
    }, []);

    const fetchNotificationSettings = async () => {
        try {
            const response = await settingsAPI.getNotificationSettings(type);
            setSettings(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '설정을 불러오는데 실패했습니다.');
        }
    };

    const handleToggle = async (settingType, value) => {
        try {
            setLoading(true);
            const response = await settingsAPI.updateNotificationSettings(type, {
                [settingType]: value
            });

            if (response.data.success) {
                setSettings(prev => ({
                    ...prev,
                    [settingType]: value
                }));
                await AsyncStorage.setItem(`notification_${type}_${settingType}`, value.toString());
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '설정 변경에 실패했습니다.');
            // 실패시 토글 되돌리기
            setSettings(prev => ({
                ...prev,
                [settingType]: !value
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.item}>
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>푸시 알림</Text>
                        <Text style={styles.itemDescription}>
                            앱 알림을 통해 새로운 소식을 받아보세요
                        </Text>
                    </View>
                    <Switch
                        value={settings.pushEnabled}
                        onValueChange={(value) => handleToggle('pushEnabled', value)}
                        trackColor={{ false: '#767577', true: '#0066FF' }}
                        thumbColor={settings.pushEnabled ? '#fff' : '#f4f3f4'}
                        disabled={loading}
                    />
                </View>

                <View style={styles.item}>
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>이메일</Text>
                        <Text style={styles.itemDescription}>
                            이메일로 중요한 알림을 받아보세요
                        </Text>
                    </View>
                    <Switch
                        value={settings.emailEnabled}
                        onValueChange={(value) => handleToggle('emailEnabled', value)}
                        trackColor={{ false: '#767577', true: '#0066FF' }}
                        thumbColor={settings.emailEnabled ? '#fff' : '#f4f3f4'}
                        disabled={loading}
                    />
                </View>
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
    content: {
        flex: 1,
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemInfo: {
        flex: 1,
        marginRight: 16,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 14,
        color: '#666',
    },
});

export default NotificationDetailScreen;