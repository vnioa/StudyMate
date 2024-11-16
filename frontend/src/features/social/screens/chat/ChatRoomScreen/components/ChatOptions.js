// features/social/screens/chat/ChatRoomScreen/components/ChatOptions.js
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../../../../hooks/useChat';
import styles from '../styles';

const ChatOptions = ({
                         isVisible,
                         onClose,
                         chatId,
                         isGroup,
                         isPinned,
                         isMuted,
                         participants = []
                     }) => {
    const navigation = useNavigation();
    const { togglePin, toggleMute, updateParticipants, deleteChatRoom } = useChat();

    // 참가자 관리
    const handleParticipantManage = useCallback(() => {
        onClose();
        Alert.alert(
            '참가자 관리',
            `현재 참가자 ${participants.length}명`,
            [
                {
                    text: '초대하기',
                    onPress: () => {
                        navigation.navigate('InviteParticipants', {
                            chatId,
                            currentParticipants: participants
                        });
                    }
                },
                {
                    text: '참가자 목록',
                    onPress: () => {
                        navigation.navigate('ManageParticipants', {
                            chatId,
                            participants,
                            onRemove: (participantIds) => {
                                updateParticipants(chatId, {
                                    action: 'remove',
                                    participants: participantIds.map(id => ({ id }))
                                });
                            }
                        });
                    }
                },
                { text: '취소', style: 'cancel' }
            ]
        );
    }, [chatId, participants, navigation, updateParticipants, onClose]);

    // 채팅방 나가기
    const handleLeaveChat = useCallback(async () => {
        Alert.alert(
            '채팅방 나가기',
            isGroup && participants.length > 1
                ? '그룹을 나가시겠습니까?'
                : '채팅방을 나가시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '나가기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (isGroup) {
                                await updateParticipants(chatId, {
                                    action: 'remove',
                                    participants: [{ id: 'currentUserId' }]
                                });
                            } else {
                                await deleteChatRoom(chatId);
                            }
                            onClose();
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('오류', '채팅방을 나가는데 실패했습니다.');
                        }
                    }
                }
            ]
        );
    }, [chatId, isGroup, participants.length, updateParticipants, deleteChatRoom, navigation, onClose]);

    // 채팅방 고정/해제
    const handleTogglePin = useCallback(async () => {
        try {
            await togglePin(chatId);
            onClose();
        } catch (error) {
            Alert.alert('오류', '채팅방 고정 상태를 변경하는데 실패했습니다.');
        }
    }, [chatId, togglePin, onClose]);

    // 알림 설정
    const handleToggleMute = useCallback(async () => {
        try {
            await toggleMute(chatId);
            onClose();
        } catch (error) {
            Alert.alert('오류', '알림 설정을 변경하는데 실패했습니다.');
        }
    }, [chatId, toggleMute, onClose]);

    // 채팅방 정보
    const handleInfoPress = useCallback(() => {
        onClose();
        navigation.navigate('ChatInfo', {
            chatId,
            isGroup,
            participantsCount: participants.length
        });
    }, [chatId, isGroup, participants.length, navigation, onClose]);

    const options = [
        {
            icon: isPinned ? 'pin-off' : 'pin',
            label: isPinned ? '고정 해제' : '채팅방 고정',
            onPress: handleTogglePin
        },
        {
            icon: isMuted ? 'notifications' : 'notifications-off',
            label: isMuted ? '알림 켜기' : '알림 끄기',
            onPress: handleToggleMute
        },
        isGroup && {
            icon: 'people',
            label: `참가자 관리 (${participants.length})`,
            onPress: handleParticipantManage
        },
        {
            icon: 'information-circle',
            label: isGroup ? '그룹 정보' : '채팅 정보',
            onPress: handleInfoPress
        },
        {
            icon: 'exit',
            label: isGroup ? '그룹 나가기' : '채팅방 나가기',
            onPress: handleLeaveChat,
            destructive: true
        }
    ].filter(Boolean);

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.optionsContainer}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionItem,
                                option.destructive && styles.destructiveOption
                            ]}
                            onPress={option.onPress}
                        >
                            <Ionicons
                                name={option.icon}
                                size={24}
                                color={option.destructive ? '#FF3B30' : '#000'}
                            />
                            <Text
                                style={[
                                    styles.optionText,
                                    option.destructive && styles.destructiveText
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

ChatOptions.defaultProps = {
    isVisible: false,
    participants: [],
    isGroup: false,
    isPinned: false,
    isMuted: false,
    onClose: () => {}
};

export default memo(ChatOptions);