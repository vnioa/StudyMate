// features/social/screens/chat/ChatRoomScreen/components/MessageItem.js
import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import styles from '../styles';

const MessageItem = ({
                         message,
                         isMyMessage,
                         showAvatar = true,
                         onLongPress,
                         onFilePress,
                         previousMessage,
                         nextMessage
                     }) => {
    const {
        id,
        content,
        type,
        createdAt,
        sender,
        isRead,
        fileName,
        fileSize,
        mimeType,
        status = 'sent'
    } = message;

    // 메시지 시간 포맷팅
    const formattedTime = useMemo(() => {
        const messageDate = new Date(createdAt);
        return format(messageDate, 'HH:mm');
    }, [createdAt]);

    // 날짜 구분선 표시 여부
    const showDateSeparator = useMemo(() => {
        if (!previousMessage) return true;

        const currentDate = new Date(createdAt);
        const prevDate = new Date(previousMessage.createdAt);

        return currentDate.toDateString() !== prevDate.toDateString();
    }, [createdAt, previousMessage]);

    // 아바타 표시 여부
    const shouldShowAvatar = useMemo(() => {
        if (!showAvatar || isMyMessage) return false;
        if (!nextMessage) return true;

        return nextMessage.sender.id !== sender.id;
    }, [showAvatar, isMyMessage, nextMessage, sender]);

    // 파일 크기 포맷팅
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    // 파일 다운로드 처리
    const handleFileDownload = async () => {
        if (type !== 'file') return;

        try {
            const callback = downloadProgress => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                console.log(`Download Progress: ${progress * 100}%`);
            };

            const downloadResumable = FileSystem.createDownloadResumable(
                content,
                FileSystem.documentDirectory + fileName,
                {},
                callback
            );

            const { uri } = await downloadResumable.downloadAsync();
            if (onFilePress) {
                onFilePress(uri, mimeType);
            }
        } catch (error) {
            Alert.alert('오류', '파일 다운로드에 실패했습니다.');
        }
    };

    // 시스템 메시지 렌더링
    if (type === 'system') {
        return (
            <View style={styles.systemMessageContainer}>
                <Text style={styles.systemMessageText}>{content}</Text>
            </View>
        );
    }

    // 날짜 구분선 렌더링
    const renderDateSeparator = () => {
        if (showDateSeparator) {
            return (
                <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>
                        {format(new Date(createdAt), 'yyyy년 M월 d일 EEEE', { locale: ko })}
                    </Text>
                </View>
            );
        }
        return null;
    };

    return (
        <>
            {renderDateSeparator()}
            <TouchableOpacity
                style={[
                    styles.messageContainer,
                    isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
                ]}
                onLongPress={() => onLongPress?.(message)}
                activeOpacity={0.8}
            >
                {shouldShowAvatar && (
                    <View style={styles.avatarContainer}>
                        <Image
                            source={
                                sender.avatar
                                    ? { uri: sender.avatar }
                                    : require('../../../../../../assets/icons/user.png')
                            }
                            style={styles.avatar}
                        />
                    </View>
                )}

                <View style={[
                    styles.messageContent,
                    isMyMessage ? styles.myMessageContent : styles.otherMessageContent
                ]}>
                    {!isMyMessage && !previousMessage?.sender?.id === sender.id && (
                        <Text style={styles.senderName}>{sender.name}</Text>
                    )}

                    {type === 'file' ? (
                        <TouchableOpacity
                            style={styles.fileContainer}
                            onPress={handleFileDownload}
                        >
                            <Ionicons
                                name={mimeType.startsWith('image/') ? 'image' : 'document'}
                                size={24}
                                color="#666"
                            />
                            <View style={styles.fileInfo}>
                                <Text style={styles.fileName} numberOfLines={1}>
                                    {fileName}
                                </Text>
                                <Text style={styles.fileSize}>
                                    {formatFileSize(fileSize)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <Text style={[
                            styles.messageText,
                            isMyMessage ? styles.myMessageText : styles.otherMessageText
                        ]}>
                            {content}
                        </Text>
                    )}

                    <View style={[
                        styles.messageFooter,
                        isMyMessage ? styles.myMessageFooter : styles.otherMessageFooter
                    ]}>
                        {isMyMessage && (
                            <Text style={styles.messageStatus}>
                                {status === 'sent' ? '전송됨' : '전송 중'}
                            </Text>
                        )}
                        <Text style={styles.messageTime}>{formattedTime}</Text>
                        {isMyMessage && isRead && (
                            <Ionicons name="checkmark-done" size={16} color="#0057D9" />
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </>
    );
};

MessageItem.defaultProps = {
    showAvatar: true,
    onLongPress: null,
    onFilePress: null,
    previousMessage: null,
    nextMessage: null
};

export default memo(MessageItem);