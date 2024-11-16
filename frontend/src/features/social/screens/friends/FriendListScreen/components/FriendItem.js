// features/social/screens/friend/FriendListScreen/components/FriendItem.js
import React, { memo, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import styles from '../styles';

const FriendItem = ({
                        friend,
                        onPress,
                        onRemove,
                        onBlock,
                        onChat,
                        showLastActive = true
                    }) => {
    const {
        id,
        name,
        avatar,
        status,
        isOnline,
        lastActive,
        statusMessage,
        mutualFriends
    } = friend;

    // 상태 메시지 표시 처리
    const getStatusDisplay = useCallback(() => {
        if (statusMessage) {
            return (
                <Text style={styles.statusMessage} numberOfLines={1}>
                    {statusMessage}
                </Text>
            );
        }

        if (status) {
            return (
                <Text style={[
                    styles.statusMessage,
                    status === 'away' && styles.statusAway,
                    status === 'busy' && styles.statusBusy
                ]} numberOfLines={1}>
                    {status === 'away' ? '자리비움' : status === 'busy' ? '다른 용무 중' : '온라인'}
                </Text>
            );
        }

        if (showLastActive && lastActive) {
            return (
                <Text style={styles.lastActive}>
                    마지막 접속: {format(new Date(lastActive), 'M월 d일 HH:mm', { locale: ko })}
                </Text>
            );
        }

        return null;
    }, [status, statusMessage, showLastActive, lastActive]);

    // 친구 삭제
    const handleRemove = useCallback(() => {
        Alert.alert(
            '친구 삭제',
            `${name}님을 친구 목록에서 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => onRemove?.(id)
                }
            ]
        );
    }, [id, name, onRemove]);

    // 친구 차단
    const handleBlock = useCallback(() => {
        Alert.alert(
            '친구 차단',
            `${name}님을 차단하시겠습니까?\n차단 시 서로 메시지를 주고받을 수 없습니다.`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '차단',
                    style: 'destructive',
                    onPress: () => onBlock?.(id)
                }
            ]
        );
    }, [id, name, onBlock]);

    // 옵션 메뉴
    const handleLongPress = useCallback(() => {
        Alert.alert(
            name,
            status ? `현재 상태: ${
                status === 'away' ? '자리비움' :
                    status === 'busy' ? '다른 용무 중' : '온라인'
            }` : '',
            [
                {
                    text: '1:1 채팅',
                    onPress: () => onChat?.(id),
                    disabled: status === 'busy'
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: handleRemove
                },
                {
                    text: '차단',
                    style: 'destructive',
                    onPress: handleBlock
                },
                {
                    text: '취소',
                    style: 'cancel'
                }
            ]
        );
    }, [name, id, status, onChat, handleRemove, handleBlock]);

    return (
        <TouchableOpacity
            style={[
                styles.friendItem,
                status === 'busy' && styles.friendItemBusy
            ]}
            onPress={() => onPress?.(id)}
            onLongPress={handleLongPress}
            activeOpacity={0.7}
        >
            <View style={styles.friendInfo}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={
                            avatar
                                ? { uri: avatar }
                                : require('../../../../../../assets/icons/user.png')
                        }
                        style={styles.avatar}
                        defaultSource={require('../../../../../../assets/icons/user.png')}
                    />
                    {isOnline && (
                        <View style={[
                            styles.onlineIndicator,
                            status === 'away' && styles.awayIndicator,
                            status === 'busy' && styles.busyIndicator
                        ]} />
                    )}
                </View>

                <View style={styles.friendDetails}>
                    <Text style={styles.friendName} numberOfLines={1}>
                        {name}
                    </Text>
                    {getStatusDisplay()}
                    {mutualFriends > 0 && (
                        <Text style={styles.mutualFriends}>
                            함께 아는 친구 {mutualFriends}명
                        </Text>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.chatButton,
                    status === 'busy' && styles.chatButtonDisabled
                ]}
                onPress={() => status !== 'busy' && onChat?.(id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={status === 'busy'}
            >
                <Ionicons
                    name="chatbubble-outline"
                    size={24}
                    color={status === 'busy' ? "#8E8E93" : "#0057D9"}
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

FriendItem.defaultProps = {
    showLastActive: true,
    onPress: null,
    onRemove: null,
    onBlock: null,
    onChat: null
};

export default memo(FriendItem);