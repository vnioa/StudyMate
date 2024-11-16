// features/social/screens/chat/ChatRoomScreen/components/ChatHeader.js
import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../../../hooks/useChat';
import styles from '../styles';

const ChatHeader = ({
                        chatId,
                        title,
                        participants = [],
                        thumbnail,
                        isGroup,
                        isOnline,
                        isPinned,
                        isMuted,
                        onPinPress,
                        onMutePress,
                        onInfoPress
                    }) => {
    const navigation = useNavigation();
    const { updateParticipants } = useChat();

    // 참가자 정보 포맷팅
    const participantInfo = useMemo(() => {
        if (!isGroup) {
            return isOnline ? '온라인' : '오프라인';
        }
        const onlineCount = participants.filter(p => p.isOnline).length;
        return `참가자 ${participants.length}명 • ${onlineCount}명 온라인`;
    }, [isGroup, isOnline, participants]);

    // 참가자 관리
    const handleParticipantManage = useCallback(() => {
        Alert.alert(
            '참가자 관리',
            '참가자를 관리하시겠습니까?',
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
                    text: '참가자 내보내기',
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
                {
                    text: '취소',
                    style: 'cancel'
                }
            ]
        );
    }, [chatId, participants, navigation, updateParticipants]);

    // 뒤로가기
    const handleGoBack = () => {
        navigation.goBack();
    };

    // 옵션 메뉴
    const handleOptionsPress = () => {
        const options = [
            {
                text: isPinned ? '고정 해제' : '채팅방 고정',
                icon: isPinned ? 'pin-off' : 'pin',
                onPress: onPinPress
            },
            {
                text: isMuted ? '알림 켜기' : '알림 끄기',
                icon: isMuted ? 'notifications' : 'notifications-off',
                onPress: onMutePress
            },
            {
                text: isGroup ? '그룹 정보' : '채팅 정보',
                icon: 'information-circle',
                onPress: onInfoPress
            }
        ];

        navigation.navigate('ChatOptions', {
            chatId,
            options,
            isGroup
        });
    };

    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.titleContainer}
                onPress={onInfoPress}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    <Image
                        source={thumbnail ? { uri: thumbnail } : require('../../../../../../assets/icons/user.png')}
                        style={styles.avatar}
                        defaultSource={require('../../../../../../assets/icons/user.png')}
                    />
                    {isOnline && !isGroup && (
                        <View style={styles.onlineIndicator} />
                    )}
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {participantInfo}
                    </Text>
                </View>
            </TouchableOpacity>

            <View style={styles.actionsContainer}>
                {isGroup && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleParticipantManage}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="people" size={24} color="#000" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleOptionsPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="ellipsis-vertical" size={24} color="#000" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

ChatHeader.defaultProps = {
    participants: [],
    isGroup: false,
    isOnline: false,
    isPinned: false,
    isMuted: false,
    onPinPress: null,
    onMutePress: null,
    onInfoPress: null
};

export default React.memo(ChatHeader);