// features/social/screens/chat/ChatSettingsScreen/components/ChatActions.js
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../../../../hooks/useChat';
import styles from '../styles';

const ChatActions = ({ chatId, isGroup }) => {
    const navigation = useNavigation();
    const { deleteChatRoom, updateParticipants } = useChat();

    // 채팅방 나가기
    const handleLeaveChat = useCallback(() => {
        Alert.alert(
            isGroup ? '그룹 나가기' : '채팅방 나가기',
            isGroup
                ? '그룹에서 나가시겠습니까?\n나가기 후에는 초대를 받아야 다시 참여할 수 있습니다.'
                : '채팅방을 나가시겠습니까?\n대화 내용이 모두 삭제됩니다.',
            [
                {
                    text: '취소',
                    style: 'cancel'
                },
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
                            navigation.navigate('ChatList');
                        } catch (error) {
                            Alert.alert('오류', '채팅방을 나가는데 실패했습니다.');
                        }
                    }
                }
            ]
        );
    }, [chatId, isGroup, navigation, updateParticipants, deleteChatRoom]);

    // 채팅방 차단
    const handleBlockChat = useCallback(() => {
        Alert.alert(
            '채팅방 차단',
            '이 채팅방을 차단하시겠습니까?\n차단 시 더 이상 메시지를 받지 않습니다.',
            [
                {
                    text: '취소',
                    style: 'cancel'
                },
                {
                    text: '차단',
                    style: 'destructive',
                    onPress: () => {
                        // 차단 로직 구현
                        Alert.alert('알림', '채팅방이 차단되었습니다.');
                        navigation.navigate('ChatList');
                    }
                }
            ]
        );
    }, [navigation]);

    // 신고하기
    const handleReport = useCallback(() => {
        Alert.alert(
            '신고하기',
            '이 채팅방을 신고하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel'
                },
                {
                    text: '신고',
                    style: 'destructive',
                    onPress: () => {
                        navigation.navigate('ReportChat', { chatId });
                    }
                }
            ]
        );
    }, [navigation, chatId]);

    return (
        <View style={styles.actionContainer}>
            <Text style={styles.actionSectionTitle}>채팅방 관리</Text>

            <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLeaveChat}
            >
                <Ionicons name="exit-outline" size={24} color="#FF3B30" />
                <Text style={[styles.actionText, styles.destructiveText]}>
                    {isGroup ? '그룹 나가기' : '채팅방 나가기'}
                </Text>
            </TouchableOpacity>

            {!isGroup && (
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleBlockChat}
                >
                    <Ionicons name="ban-outline" size={24} color="#FF3B30" />
                    <Text style={[styles.actionText, styles.destructiveText]}>
                        채팅방 차단
                    </Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={styles.actionButton}
                onPress={handleReport}
            >
                <Ionicons name="warning-outline" size={24} color="#FF3B30" />
                <Text style={[styles.actionText, styles.destructiveText]}>
                    신고하기
                </Text>
            </TouchableOpacity>
        </View>
    );
};

ChatActions.defaultProps = {
    isGroup: false
};

export default memo(ChatActions);