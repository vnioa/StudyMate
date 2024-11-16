// features/social/screens/chat/ChatListScreen/components/ChatRoomItem.js
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import styles from '../styles';

const ChatRoomItem = ({
                          room,
                          onPress,
                          onDelete,
                          onLongPress,
                          onPinPress,
                          onMutePress
                      }) => {
    const {
        id,
        title,
        lastMessage,
        timestamp,
        unreadCount,
        isGroup,
        participants,
        thumbnail,
        isOnline,
        isTyping,
        isPinned,
        isMuted,
        lastMessageType,
        sender
    } = room;

    // 시간 포맷팅
    const formatTimestamp = useCallback((time) => {
        const messageDate = new Date(time);
        const now = new Date();

        if (messageDate.toDateString() === now.toDateString()) {
            return format(messageDate, 'HH:mm');
        } else if (messageDate.getFullYear() === now.getFullYear()) {
            return format(messageDate, 'M월 d일', { locale: ko });
        }
        return format(messageDate, 'yyyy.MM.dd', { locale: ko });
    }, []);

    // 마지막 메시지 표시 처리
    const renderLastMessage = useCallback(() => {
        if (isTyping) {
            return <Text style={styles.typingText}>입력 중...</Text>;
        }

        switch (lastMessageType) {
            case 'image':
                return <Text style={styles.lastMessage}>사진</Text>;
            case 'file':
                return <Text style={styles.lastMessage}>파일</Text>;
            case 'voice':
                return <Text style={styles.lastMessage}>음성 메시지</Text>;
            case 'video':
                return <Text style={styles.lastMessage}>동영상</Text>;
            case 'location':
                return <Text style={styles.lastMessage}>위치 공유</Text>;
            default:
                return (
                    <Text style={[
                        styles.lastMessage,
                        isMuted && styles.mutedText
                    ]} numberOfLines={1}>
                        {isGroup && sender ? `${sender}: ${lastMessage}` : lastMessage}
                    </Text>
                );
        }
    }, [isTyping, lastMessageType, isGroup, sender, lastMessage, isMuted]);

    // 롱프레스 핸들러
    const handleLongPress = useCallback(() => {
        Alert.alert(
            title,
            '채팅방 관리',
            [
                {
                    text: isPinned ? '고정 해제' : '고정하기',
                    onPress: () => onPinPress?.(id)
                },
                {
                    text: isMuted ? '알림 켜기' : '알림 끄기',
                    onPress: () => onMutePress?.(id)
                },
                isGroup && {
                    text: '그룹 정보',
                    onPress: () => onLongPress?.(id, 'groupInfo')
                },
                {
                    text: '삭제',
                    onPress: () => {
                        Alert.alert(
                            '채팅방 삭제',
                            '정말로 이 채팅방을 삭제하시겠습니까?',
                            [
                                { text: '취소', style: 'cancel' },
                                {
                                    text: '삭제',
                                    onPress: () => onDelete?.(id),
                                    style: 'destructive'
                                }
                            ]
                        );
                    },
                    style: 'destructive'
                },
                { text: '취소', style: 'cancel' }
            ].filter(Boolean),
            { cancelable: true }
        );
    }, [id, title, isPinned, isMuted, isGroup, onPinPress, onMutePress, onLongPress, onDelete]);

    return (
        <TouchableOpacity
            onPress={() => onPress?.(id)}
            onLongPress={handleLongPress}
            activeOpacity={0.7}
            style={[
                styles.roomItem,
                isPinned && styles.pinnedRoom,
                isMuted && styles.mutedRoom
            ]}
        >
            <View style={styles.avatarContainer}>
                <Image
                    source={thumbnail ? { uri: thumbnail } : require('../../../../../../assets/icons/user.png')}
                    style={styles.avatar}
                    defaultSource={require('../../../../../../assets/icons/user.png')}
                />
                {isOnline && <View style={styles.onlineIndicator} />}
                {isPinned && (
                    <View style={styles.pinnedIndicator}>
                        <Ionicons name="pin" size={12} color="#FFF" />
                    </View>
                )}
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.headerContainer}>
                    <Text style={[
                        styles.title,
                        isMuted && styles.mutedText
                    ]} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={[
                        styles.timestamp,
                        isMuted && styles.mutedText
                    ]}>
                        {formatTimestamp(timestamp)}
                    </Text>
                </View>

                <View style={styles.messageContainer}>
                    {renderLastMessage()}
                    {unreadCount > 0 && !isMuted && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadCount}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                    {isMuted && (
                        <Ionicons
                            name="notifications-off-outline"
                            size={16}
                            color="#8E8E93"
                            style={styles.muteIcon}
                        />
                    )}
                </View>
            </View>

            {isGroup && (
                <View style={styles.groupInfo}>
                    <Ionicons
                        name="people"
                        size={16}
                        color={isMuted ? '#8E8E93' : '#666'}
                    />
                    <Text style={[
                        styles.participantCount,
                        isMuted && styles.mutedText
                    ]}>
                        {participants.length}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

ChatRoomItem.defaultProps = {
    room: {
        id: '',
        title: '',
        lastMessage: '',
        timestamp: new Date(),
        unreadCount: 0,
        isGroup: false,
        participants: [],
        thumbnail: null,
        isOnline: false,
        isTyping: false,
        isPinned: false,
        isMuted: false,
        lastMessageType: 'text',
        sender: null
    },
    onPress: null,
    onDelete: null,
    onLongPress: null,
    onPinPress: null,
    onMutePress: null
};

export default memo(ChatRoomItem);