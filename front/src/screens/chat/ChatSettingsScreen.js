import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Header from '../../components/shared/Header';
import CustomButton from '../../components/shared/CustomButton';
import {API_URL} from "../../config/apiUrl";

const ChatSettingsScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { roomId } = route.params;

    const [settings, setSettings] = useState({
        notifications: true,
        theme: 'default',
        encryption: false
    });

    const [participants, setParticipants] = useState([]);

    useEffect(() => {
        fetchRoomSettings();
        fetchParticipants();
    }, []);

    const fetchRoomSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/chat/rooms/${roomId}/settings`);
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('설정 조회 실패:', error);
        }
    };

    const fetchParticipants = async () => {
        try {
            const response = await fetch(`${API_URL}/chat/rooms/${roomId}/participants`);
            const data = await response.json();
            setParticipants(data);
        } catch (error) {
            console.error('참여자 목록 조회 실패:', error);
        }
    };

    const updateSettings = async (key, value) => {
        try {
            await fetch(`${API_URL}/chat/rooms/${roomId}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ [key]: value })
            });
            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (error) {
            console.error('설정 업데이트 실패:', error);
        }
    };

    const handleLeaveRoom = () => {
        Alert.alert(
            "채팅방 나가기",
            "정말 나가시겠습니까?",
            [
                {
                    text: "취소",
                    style: "cancel"
                },
                {
                    text: "나가기",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await fetch(`${API_URL}/chat/rooms/${roomId}/leave`, {
                                method: 'POST'
                            });
                            navigation.navigate('ChatList');
                        } catch (error) {
                            console.error('채팅방 나가기 실패:', error);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Header
                title="채팅방 설정"
                showBack={true}
            />
            <ScrollView>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>알림 설정</Text>
                    <View style={styles.settingItem}>
                        <Text>알림 받기</Text>
                        <Switch
                            value={settings.notifications}
                            onValueChange={(value) => updateSettings('notifications', value)}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>채팅방 관리</Text>
                    <View style={styles.settingItem}>
                        <Text>암호화</Text>
                        <Switch
                            value={settings.encryption}
                            onValueChange={(value) => updateSettings('encryption', value)}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>참여자 관리</Text>
                    {participants.map(participant => (
                        <View key={participant.id} style={styles.participantItem}>
                            <Text>{participant.name}</Text>
                            <Text style={styles.roleText}>{participant.role}</Text>
                        </View>
                    ))}
                </View>

                <CustomButton
                    title="채팅방 나가기"
                    type="danger"
                    onPress={handleLeaveRoom}
                    buttonStyle={styles.leaveButton}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8
    },
    participantItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12
    },
    roleText: {
        color: '#8E8E93',
        fontSize: 14
    },
    leaveButton: {
        margin: 16
    }
});

export default ChatSettingsScreen;