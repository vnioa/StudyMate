import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MessageItem = ({ message, onReply, onForward, onDelete }) => {
    const { content, type, timestamp, isMine, isRead, isImportant } = message;

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderContent = () => {
        switch (type) {
            case 'text':
                return <Text style={styles.messageText}>{content}</Text>;
            case 'image':
                return (
                    <Image
                        source={{ uri: content }}
                        style={styles.imageContent}
                        resizeMode="cover"
                    />
                );
            case 'file':
                return (
                    <View style={styles.fileContainer}>
                        <Ionicons name="document-outline" size={24} color="#666" />
                        <Text style={styles.fileName}>{content.fileName}</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={[
            styles.container,
            isMine ? styles.myMessage : styles.otherMessage
        ]}>
            <View style={[
                styles.messageContainer,
                isMine ? styles.myMessageContainer : styles.otherMessageContainer
            ]}>
                {isImportant && (
                    <Ionicons name="star" size={16} color="#FFD700" style={styles.star} />
                )}

                {renderContent()}

                <View style={styles.messageFooter}>
                    <Text style={styles.timestamp}>{formatTime(timestamp)}</Text>
                    {isMine && isRead && (
                        <Ionicons name="checkmark-done" size={16} color="#007AFF" />
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.optionsButton}
                onPress={() => {
                    Alert.alert(
                        "메시지 옵션",
                        "원하는 작업을 선택하세요",
                        [
                            {
                                text: "답장",
                                onPress: () => onReply(message)
                            },
                            {
                                text: "전달",
                                onPress: () => onForward(message)
                            },
                            {
                                text: "삭제",
                                onPress: () => onDelete(message.id),
                                style: "destructive"
                            },
                            {
                                text: "취소",
                                style: "cancel"
                            }
                        ]
                    );
                }}
            >
                <Ionicons name="ellipsis-vertical" size={16} color="#666" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: 4,
        paddingHorizontal: 12
    },
    myMessage: {
        justifyContent: 'flex-end'
    },
    otherMessage: {
        justifyContent: 'flex-start'
    },
    messageContainer: {
        maxWidth: '70%',
        borderRadius: 16,
        padding: 12,
        marginHorizontal: 8
    },
    myMessageContainer: {
        backgroundColor: '#007AFF',
    },
    otherMessageContainer: {
        backgroundColor: '#E9E9EB',
    },
    messageText: {
        fontSize: 16,
        color: '#000'
    },
    imageContent: {
        width: 200,
        height: 200,
        borderRadius: 8
    },
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8
    },
    fileName: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666'
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4
    },
    timestamp: {
        fontSize: 12,
        color: '#8E8E93',
        marginRight: 4
    },
    star: {
        position: 'absolute',
        top: 4,
        right: 4
    },
    optionsButton: {
        padding: 8,
        justifyContent: 'center'
    }
});

export default MessageItem;