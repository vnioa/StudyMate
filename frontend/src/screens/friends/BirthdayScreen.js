// src/screens/friends/BirthdayScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    SectionList,
    Switch,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Calendar from 'expo-calendar';
import { CalendarList } from 'react-native-calendars';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

export default function BirthdayScreen() {
    const navigation = useNavigation();

    // 상태 관리
    const [birthdays, setBirthdays] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // list, calendar
    const [selectedDate, setSelectedDate] = useState('');
    const [notificationSettings, setNotificationSettings] = useState({
        enabled: false,
        daysBeforeNotify: 3
    });
    const [markedDates, setMarkedDates] = useState({});

    // 생일 데이터 로드
    useEffect(() => {
        loadBirthdays();
        loadNotificationSettings();
        checkCalendarPermissions();
    }, []);

    const loadBirthdays = async () => {
        try {
            setIsLoading(true);
            const response = await api.friend.getBirthdays();

            // 월별로 데이터 정리
            const organizedData = organizeBirthdays(response);
            setBirthdays(organizedData);

            // 캘린더 마커 설정
            const markers = {};
            response.forEach(friend => {
                if (friend.birthday) {
                    const birthdayDate = new Date(friend.birthday);
                    const dateString = date.format(birthdayDate, 'YYYY-MM-DD');
                    markers[dateString] = {
                        marked: true,
                        dotColor: theme.colors.primary.main
                    };
                }
            });
            setMarkedDates(markers);
        } catch (error) {
            Alert.alert('오류', '생일 정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 알림 설정 로드
    const loadNotificationSettings = async () => {
        try {
            const settings = await api.friend.getBirthdayNotificationSettings();
            setNotificationSettings(settings);
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        }
    };

    // 캘린더 권한 체크
    const checkCalendarPermissions = async () => {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status === 'granted') {
            // 캘린더 동기화
            syncBirthdaysWithCalendar();
        }
    };

    // 생일 데이터 정리
    const organizeBirthdays = (data) => {
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        return months.map(month => ({
            title: `${month}월`,
            data: data.filter(friend => {
                const birthMonth = new Date(friend.birthday).getMonth() + 1;
                return birthMonth === month;
            }).sort((a, b) => {
                const dayA = new Date(a.birthday).getDate();
                const dayB = new Date(b.birthday).getDate();
                return dayA - dayB;
            })
        })).filter(section => section.data.length > 0);
    };

    // 캘린더 동기화
    const syncBirthdaysWithCalendar = async () => {
        try {
            const calendars = await Calendar.getCalendarsAsync();
            const defaultCalendar = calendars.find(cal => cal.isPrimary);

            if (!defaultCalendar) return;

            // 기존 이벤트 삭제
            const events = await Calendar.getEventsAsync(
                [defaultCalendar.id],
                new Date(),
                new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            );

            const birthdayEvents = events.filter(event =>
                event.title.includes('생일')
            );

            await Promise.all(
                birthdayEvents.map(event =>
                    Calendar.deleteEventAsync(event.id)
                )
            );

            // 새 이벤트 추가
            birthdays.forEach(section => {
                section.data.forEach(async friend => {
                    const birthDate = new Date(friend.birthday);
                    const thisYear = new Date().getFullYear();
                    birthDate.setFullYear(thisYear);

                    await Calendar.createEventAsync(defaultCalendar.id, {
                        title: `${friend.name}님의 생일`,
                        startDate: birthDate,
                        endDate: new Date(birthDate.getTime() + 24 * 60 * 60 * 1000),
                        allDay: true,
                        alarms: [{
                            relativeOffset: -24 * 60, // 하루 전
                            method: Calendar.AlarmMethod.ALERT
                        }]
                    });
                });
            });

            Alert.alert('성공', '캘린더와 동기화되었습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '캘린더 동기화에 실패했습니다.');
        }
    };

    // 알림 설정 변경
    const handleNotificationToggle = async (value) => {
        try {
            await api.friend.updateBirthdayNotificationSettings({
                ...notificationSettings,
                enabled: value
            });
            setNotificationSettings(prev => ({
                ...prev,
                enabled: value
            }));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
        }
    };

    // 생일자 아이템 렌더링
    const renderBirthdayItem = ({ item }) => (
        <TouchableOpacity
            style={styles.birthdayItem}
            onPress={() => navigation.navigate('FriendDetail', { friendId: item.id })}
        >
            <Avatar
                source={{ uri: item.avatar }}
                size="medium"
                style={styles.avatar}
            />
            <View style={styles.birthdayInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.birthdayDate}>
                    {date.format(item.birthday, 'M월 D일')}
                    {item.age && ` (${item.age}세)`}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.sendButton}
                onPress={() => navigation.navigate('ChatRoom', {
                    roomId: item.chatRoomId,
                    name: item.name
                })}
            >
                <Ionicons name="gift-outline" size={24} color={theme.colors.primary.main} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // 섹션 헤더 렌더링
    const renderSectionHeader = ({ section: { title, data } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionCount}>{data.length}명</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* 상단 옵션 */}
            <View style={styles.header}>
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            viewMode === 'list' && styles.toggleButtonActive
                        ]}
                        onPress={() => {
                            setViewMode('list');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <Ionicons
                            name="list"
                            size={24}
                            color={viewMode === 'list'
                                ? theme.colors.primary.main
                                : theme.colors.text.secondary
                            }
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            viewMode === 'calendar' && styles.toggleButtonActive
                        ]}
                        onPress={() => {
                            setViewMode('calendar');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <Ionicons
                            name="calendar"
                            size={24}
                            color={viewMode === 'calendar'
                                ? theme.colors.primary.main
                                : theme.colors.text.secondary
                            }
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.syncButton}
                    onPress={syncBirthdaysWithCalendar}
                >
                    <Ionicons name="sync" size={24} color={theme.colors.primary.main} />
                </TouchableOpacity>
            </View>

            {/* 알림 설정 */}
            <View style={styles.notificationSettings}>
                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>생일 알림</Text>
                    <Switch
                        value={notificationSettings.enabled}
                        onValueChange={handleNotificationToggle}
                        trackColor={{
                            false: theme.colors.grey[200],
                            true: theme.colors.primary.main + '50'
                        }}
                        thumbColor={notificationSettings.enabled
                            ? theme.colors.primary.main
                            : theme.colors.grey[400]
                        }
                    />
                </View>
            </View>

            {viewMode === 'calendar' ? (
                <CalendarList
                    current={selectedDate || new Date()}
                    markedDates={markedDates}
                    onDayPress={day => setSelectedDate(day.dateString)}
                    theme={{
                        todayTextColor: theme.colors.primary.main,
                        selectedDayBackgroundColor: theme.colors.primary.main,
                        dotColor: theme.colors.primary.main
                    }}
                    horizontal
                    pagingEnabled
                />
            ) : (
                <SectionList
                    sections={birthdays}
                    renderItem={renderBirthdayItem}
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name="calendar-outline"
                                size={48}
                                color={theme.colors.text.secondary}
                            />
                            <Text style={styles.emptyText}>
                                등록된 생일이 없습니다
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: 20,
        padding: 4,
    },
    toggleButton: {
        padding: theme.spacing.sm,
        borderRadius: 16,
    },
    toggleButtonActive: {
        backgroundColor: theme.colors.background.primary,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    syncButton: {
        padding: theme.spacing.sm,
    },
    notificationSettings: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    listContent: {
        paddingBottom: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    sectionCount: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    birthdayItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    avatar: {
        marginRight: theme.spacing.md,
    },
    birthdayInfo: {
        flex: 1,
    },
    name: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    birthdayDate: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    sendButton: {
        padding: theme.spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl * 2,
    },
    emptyText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    calendarContainer: {
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    calendarHeader: {
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 0,
    },
    calendarHeaderText: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    calendarDayText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.primary,
    },
    calendarDaySelected: {
        backgroundColor: theme.colors.primary.main,
    },
    calendarDaySelectedText: {
        color: theme.colors.text.contrast,
        fontFamily: theme.typography.fontFamily.medium,
    },
    calendarDayMarked: {
        backgroundColor: theme.colors.primary.main + '20',
    }
});