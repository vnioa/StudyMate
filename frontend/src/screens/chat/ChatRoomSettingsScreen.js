import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { chat } from '../services/api';

const ChatRoomSettingsScreen = ({ navigation, route }) => {
    const { roomId } = route.params;
    const [loading, setLoading] = useState(false);
    const [roomSettings, setRoomSettings] = useState({
        notification: true,
        encryption: true,
        theme: 'light',
        roomName: '알고리즘 스터디',
        participants: []
    });
    const [showThemeModal, setShowThemeModal] = useState(false);

    useEffect(() => {
        fetchRoomSettings();
    }, [roomId]);

    const fetchRoomSettings = async () => {
        try {
            setLoading(true);
            const response = await chat.getRoomDetail(roomId);
            setRoomSettings(response.data);
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = async (setting, value) => {
        try {
            setLoading(true);
            await chat.updateRoomSettings(roomId, { [setting]: value });
            setRoomSettings(prev => ({ ...prev, [setting]: value }));
        } catch (error) {
            Alert.alert('오류', '설정 변경에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveChat = async () => {
        Alert.alert(
            '채팅방 나가기',
            '정말로 이 채팅방을 나가시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '나가기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await chat.deleteRoom(roomId);
                            navigation.navigate('ChatList');
                        } catch (error) {
                            Alert.alert('오류', '채팅방을 나가는데 실패했습니다');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>채팅방 설정</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => navigation.navigate('EditRoomName', { roomId })}
                    >
                        <View style={styles.settingLeft}>
                            <Icon name="edit-2" size={20} color="#333" />
                            <View>
                                <Text style={styles.settingText}>채팅방 이름</Text>
                                <Text style={styles.settingSubtext}>{roomSettings.roomName}</Text>
                            </View>
                        </View>
                        <Icon name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => navigation.navigate('ParticipantManagement', { roomId })}
                    >
                        <View style={styles.settingLeft}>
                            <Icon name="users" size={20} color="#333" />
                            <View>
                                <Text style={styles.settingText}>참여자 관리</Text>
                                <Text style={styles.settingSubtext}>
                                    {roomSettings.participants.length}명 참여 중
                                </Text>
                            </View>
                        </View>
                        <Icon name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Icon name="bell" size={20} color="#333" />
                            <Text style={styles.settingText}>알림 설정</Text>
                        </View>
                        <Switch
                            value={roomSettings.notification}
                            onValueChange={(value) => handleSettingChange('notification', value)}
                            trackColor={{ false: '#767577', true: '#4A90E2' }}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setShowThemeModal(true)}
                    >
                        <View style={styles.settingLeft}>
                            <Icon name="layout" size={20} color="#333" />
                            <Text style={styles.settingText}>테마 설정</Text>
                        </View>
                        <Text style={styles.themeText}>
                            {roomSettings.theme === 'light' ? '라이트' : '다크'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.settingItem, styles.leaveChat]}
                    onPress={handleLeaveChat}
                >
                    <View style={styles.settingLeft}>
                        <Icon name="log-out" size={20} color="#FF3B30" />
                        <Text style={[styles.settingText, styles.leaveText]}>
                            채팅방 나가기
                        </Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={showThemeModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowThemeModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setShowThemeModal(false)}
                    activeOpacity={1}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>테마 설정</Text>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                handleSettingChange('theme', 'light');
                                setShowThemeModal(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>라이트 모드</Text>
                            {roomSettings.theme === 'light' && (
                                <Icon name="check" size={20} color="#4A90E2" />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                handleSettingChange('theme', 'dark');
                                setShowThemeModal(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>다크 모드</Text>
                            {roomSettings.theme === 'dark' && (
                                <Icon name="check" size={20} color="#4A90E2" />
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 15,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        fontSize: 16,
        marginLeft: 15,
    },
    settingSubtext: {
        fontSize: 14,
        color: '#666',
        marginLeft: 15,
        marginTop: 2,
    },
    leaveChat: {
        marginTop: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    leaveText: {
        color: '#FF3B30',
    },
    themeText: {
        fontSize: 14,
        color: '#666',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalOptionText: {
        fontSize: 16,
    },
});

export default ChatRoomSettingsScreen;