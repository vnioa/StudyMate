import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatRoomItem = ({ room, onPress, onPin, onArchive }) => {
    const { name, lastMessage, unreadCount, isPinned, updatedAt } = room;

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();

        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    return (
        <TouchableOpacity
            style={[styles.container, isPinned && styles.pinnedContainer]}
            onPress={onPress}
        >
            <View style={styles.avatarContainer}>
                <Image
                    source={room.image ? { uri: room.image } : require('../../../assets/default-group.png')}
                    style={styles.avatar}
                />
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.headerContainer}>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    <Text style={styles.time}>{formatTime(updatedAt)}</Text>
                </View>

                <View style={styles.messageContainer}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {lastMessage?.content || ''}
                    </Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadCount}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.moreButton}
                onPress={() => {
                    Alert.alert(
                        "채팅방 관리",
                        "원하는 작업을 선택하세요",
                        [
                            {
                                text: isPinned ? "고정 해제" : "채팅방 고정",
                                onPress: onPin
                            },
                            {
                                text: "채팅방 보관",
                                onPress: onArchive
                            },
                            {
                                text: "취소",
                                style: "cancel"
                            }
                        ]
                    );
                }}
            >
                <Ionicons name="ellipsis-vertical" size={20} color="#666" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA'
    },
    pinnedContainer: {
        backgroundColor: '#F2F2F7'
    },
    avatarContainer: {
        marginRight: 12
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center'
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        flex: 1
    },
    time: {
        fontSize: 12,
        color: '#8E8E93',
        marginLeft: 8
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
        flex: 1
    },
    unreadBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        paddingHorizontal: 6
    },
    unreadCount: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    moreButton: {
        padding: 8,
        justifyContent: 'center'
    }
});

export default ChatRoomItem;