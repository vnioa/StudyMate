// features/social/screens/chat/ChatSettingsScreen/index.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useChat } from '../../../hooks/useChat';
import SettingsHeader from './components/SettingsHeader';
import ChatInfo from './components/ChatInfo';
import ParticipantList from './components/ParticipantList';
import NotificationSettings from './components/NotificationSettings';
import ChatActions from './components/ChatActions';
import styles from './styles';

const ChatSettingsScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { chatId } = route.params;
    const [isEditing, setIsEditing] = useState(false);

    const {
        chatRooms,
        updateChatRoom,
        toggleMute,
        togglePin,
        updateParticipants,
        deleteChatRoom,
        loading,
        error,
        lastUpdated
    } = useChat();

    // 현재 채팅방 정보
    const currentChat = chatRooms.find(chat => chat.id === chatId);

    // 에러 처리
    useEffect(() => {
        if (error) {
            Alert.alert('오류', error);
        }
    }, [error]);

    // 채팅방 정보 업데이트
    const handleUpdateChat = useCallback(async (updates) => {
        try {
            await updateChatRoom(chatId, updates);
            setIsEditing(false);
        } catch (err) {
            Alert.alert('오류', '채팅방 정보 수정에 실패했습니다.');
        }
    }, [chatId, updateChatRoom]);

    // 알림 설정 변경
    const handleToggleMute = useCallback(async () => {
        try {
            await toggleMute(chatId);
        } catch (err) {
            Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
        }
    }, [chatId, toggleMute]);

    // 채팅방 고정/해제
    const handleTogglePin = useCallback(async () => {
        try {
            await togglePin(chatId);
        } catch (err) {
            Alert.alert('오류', '채팅방 고정 상태 변경에 실패했습니다.');
        }
    }, [chatId, togglePin]);

    // 참가자 관리
    const handleParticipantAction = useCallback(async (action, participants) => {
        try {
            await updateParticipants(chatId, {
                action,
                participants: Array.isArray(participants) ? participants : [participants]
            });
        } catch (err) {
            Alert.alert('오류', '참가자 관리에 실패했습니다.');
        }
    }, [chatId, updateParticipants]);

    // 채팅방 나가기
    const handleLeaveChat = useCallback(async () => {
        Alert.alert(
            '채팅방 나가기',
            '정말로 이 채팅방을 나가시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '나가기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (currentChat.isGroup) {
                                await handleParticipantAction('remove', { id: 'currentUserId' });
                            } else {
                                await deleteChatRoom(chatId);
                            }
                            navigation.navigate('ChatList');
                        } catch (err) {
                            Alert.alert('오류', '채팅방을 나가는데 실패했습니다.');
                        }
                    }
                }
            ]
        );
    }, [chatId, currentChat, navigation, handleParticipantAction, deleteChatRoom]);

    if (!currentChat) {
        return null;
    }

    return (
        <View style={styles.container}>
            <SettingsHeader
                title={currentChat.isGroup ? '그룹 설정' : '채팅 설정'}
                onBack={() => navigation.goBack()}
                isEditing={isEditing}
                onEditPress={() => setIsEditing(!isEditing)}
                loading={loading}
            />
            <ScrollView style={styles.content}>
                <ChatInfo
                    chat={currentChat}
                    isEditing={isEditing}
                    onUpdate={handleUpdateChat}
                    lastUpdated={lastUpdated}
                />
                {currentChat.isGroup && (
                    <ParticipantList
                        participants={currentChat.participants}
                        onAdd={(participants) => handleParticipantAction('add', participants)}
                        onRemove={(participantId) => handleParticipantAction('remove', { id: participantId })}
                        isEditing={isEditing}
                    />
                )}
                <NotificationSettings
                    isMuted={currentChat.isMuted}
                    isPinned={currentChat.isPinned}
                    onToggleMute={handleToggleMute}
                    onTogglePin={handleTogglePin}
                />
                <ChatActions
                    isGroup={currentChat.isGroup}
                    onLeave={handleLeaveChat}
                />
            </ScrollView>
        </View>
    );
};

export default ChatSettingsScreen;