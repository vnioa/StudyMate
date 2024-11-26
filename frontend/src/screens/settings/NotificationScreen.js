import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { settingsAPI } from '../../services/api';

const NotificationScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        study: {
            achievement: {
                push: true,
                email: true
            },
            quiz: {
                push: true,
                email: true
            }
        },
        account: {
            security: {
                push: true,
                email: true
            }
        },
        schedule: {
            weekday: {
                start: '09:00',
                end: '19:00'
            },
            weekend: {
                start: '10:00',
                end: '16:00'
            }
        }
    });

    useEffect(() => {
        fetchNotificationSettings();
    }, []);

    const fetchNotificationSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getNotificationSettings();
            setNotificationSettings(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '설정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditPress = async (type, title) => {
        try {
            if (type === 'time') {
                navigation.navigate('TimeSetting', {
                    title,
                    schedule: title === '평일' ? notificationSettings.schedule.weekday : notificationSettings.schedule.weekend,
                    onSave: async (newSchedule) => {
                        await settingsAPI.updateSchedule(title, newSchedule);
                        fetchNotificationSettings();
                    }
                });
            } else {
                navigation.navigate('NotificationDetail', {
                    title,
                    settings: getSettingsByTitle(title),
                    onSave: async (newSettings) => {
                        await settingsAPI.updateNotificationSettings(title, newSettings);
                        fetchNotificationSettings();
                    }
                });
            }
        } catch (error) {
            Alert.alert('오류', '설정 변경에 실패했습니다.');
        }
    };

    const getSettingsByTitle = (title) => {
        switch(title) {
            case '목표 달성':
                return notificationSettings.study.achievement;
            case '퀴즈':
                return notificationSettings.study.quiz;
            case '보안':
                return notificationSettings.account.security;
            default:
                return null;
        }
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes} ${period}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>알림</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* 학습 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>학습</Text>
                </View>

                {Object.entries(notificationSettings.study).map(([key, value]) => (
                    <View key={key} style={styles.item}>
                        <View>
                            <Text style={styles.itemTitle}>
                                {key === 'achievement' ? '목표 달성' : '퀴즈'}
                            </Text>
                            <Text style={styles.itemSubtitle}>
                                {[
                                    value.push && '푸시',
                                    value.email && '이메일'
                                ].filter(Boolean).join(' 및 ')}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => handleEditPress('notification', key === 'achievement' ? '목표 달성' : '퀴즈')}
                        >
                            <Text style={styles.editText}>수정</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {/* 계정 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>계정</Text>
                </View>

                <View style={styles.item}>
                    <View>
                        <Text style={styles.itemTitle}>보안</Text>
                        <Text style={styles.itemSubtitle}>
                            {[
                                notificationSettings.account.security.push && '푸시',
                                notificationSettings.account.security.email && '이메일'
                            ].filter(Boolean).join(' 및 ')}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleEditPress('notification', '보안')}>
                        <Text style={styles.editText}>수정</Text>
                    </TouchableOpacity>
                </View>

                {/* 시간 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>시간</Text>
                </View>

                {Object.entries(notificationSettings.schedule).map(([key, value]) => (
                    <View key={key} style={styles.item}>
                        <View>
                            <Text style={styles.itemTitle}>
                                {key === 'weekday' ? '평일' : '주말'}
                            </Text>
                            <Text style={styles.itemSubtitle}>
                                {`${formatTime(value.start)} ~ ${formatTime(value.end)}`}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => handleEditPress('time', key === 'weekday' ? '평일' : '주말')}
                        >
                            <Text style={styles.editText}>수정</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
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
    },
    section: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f8f8f8',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    editText: {
        fontSize: 14,
        color: '#0066FF',
        fontWeight: '500',
    }
});

export default NotificationScreen;