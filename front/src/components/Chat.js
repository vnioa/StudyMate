// src/components/Chat.js

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    TextInput,
    Animated,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/styles';
import { Card, Avatar } from './UI';
import ChatListScreen from "../screens/chat/ChatListScreen";

// 채팅 버블 컴포넌트
export const MessageBubble = ({
                                  message,
                                  isMine,
                                  time,
                                  status = 'sent',
                                  files = [],
                                  reactions = []
                              }) => {
    return (
        <View style={[
            styles.messageBubbleContainer,
            isMine ? styles.myMessage : styles.otherMessage
        ]}>
            <View style={[
                styles.messageBubble,
                isMine ? styles.myBubble : styles.otherBubble
            ]}>
                {files.length > 0 && (
                    <View style={styles.fileContainer}>
                        {files.map((file, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.fileItem}
                                onPress={() => handleFilePress(file)}
                            >
                                <Ionicons
                                    name={getFileIcon(file.type)}
                                    size={24}
                                    color={theme.colors.primary.main}
                                />
                                <Text style={styles.fileName}>{file.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <Text style={[
                    styles.messageText,
                    isMine ? styles.myMessageText : styles.otherMessageText
                ]}>
                    {message}
                </Text>
                <View style={styles.messageFooter}>
                    <Text style={styles.messageTime}>{time}</Text>
                    {isMine && (
                        <Ionicons
                            name={getStatusIcon(status)}
                            size={16}
                            color={getStatusColor(status)}
                        />
                    )}
                </View>
            </View>
            {reactions.length > 0 && (
                <View style={styles.reactionsContainer}>
                    {reactions.map((reaction, index) => (
                        <Text key={index} style={styles.reaction}>
                            {reaction}
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );
};

// 채팅 입력 컴포넌트
export const ChatInput = ({
                              value,
                              onChangeText,
                              onSend,
                              onAttach,
                              onCamera,
                              isRecording = false,
                              onStartRecording,
                              onStopRecording,
                              inputHeight,
                              onInputHeightChange
                          }) => {
    return (
        <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton} onPress={onAttach}>
                <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary.main} />
            </TouchableOpacity>
            <View style={styles.inputWrapper}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    style={[styles.input, { height: inputHeight }]}
                    multiline
                    placeholder="메시지를 입력하세요"
                    placeholderTextColor={theme.colors.text.hint}
                    onContentSizeChange={(e) =>
                        onInputHeightChange(e.nativeEvent.contentSize.height)
                    }
                />
                <TouchableOpacity style={styles.cameraButton} onPress={onCamera}>
                    <Ionicons name="camera-outline" size={24} color={theme.colors.primary.main} />
                </TouchableOpacity>
            </View>
            {value.trim().length > 0 ? (
                <TouchableOpacity style={styles.sendButton} onPress={onSend}>
                    <Ionicons name="send" size={24} color={theme.colors.primary.main} />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.micButton}
                    onPress={isRecording ? onStopRecording : onStartRecording}
                >
                    <Ionicons
                        name={isRecording ? "stop-circle" : "mic-outline"}
                        size={24}
                        color={isRecording ? theme.colors.status.error : theme.colors.primary.main}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

// 채팅방 리스트 아이템 컴포넌트
export const ChatRoomItem = ({
                                 title,
                                 lastMessage,
                                 time,
                                 unreadCount,
                                 avatar,
                                 isOnline,
                                 isGroup,
                                 memberCount,
                                 onPress
                             }) => {
    return (
        <TouchableOpacity
            style={styles.chatRoomItem}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <Avatar
                    source={avatar}
                    size="medium"
                    badge={isOnline ? 'online' : null}
                />
                {isGroup && (
                    <View style={styles.memberCount}>
                        <Text style={styles.memberCountText}>{memberCount}</Text>
                    </View>
                )}
            </View>
            <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatTitle} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={styles.chatTime}>{time}</Text>
                </View>
                <View style={styles.chatFooter}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {lastMessage}
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
        </TouchableOpacity>
    );
};

// 화상 통화 컨트롤 컴포넌트
export const VideoCallControls = ({
                                      isMuted,
                                      isCameraOff,
                                      onToggleMute,
                                      onToggleCamera,
                                      onEndCall,
                                      onSwitchCamera,
                                      onChat,
                                      showChat = false
                                  }) => {
    return (
        <View style={styles.videoControls}>
            <TouchableOpacity
                style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                onPress={onToggleMute}
            >
                <Ionicons
                    name={isMuted ? "mic-off" : "mic"}
                    size={24}
                    color="#FFF"
                />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
                onPress={onToggleCamera}
            >
                <Ionicons
                    name={isCameraOff ? "videocam-off" : "videocam"}
                    size={24}
                    color="#FFF"
                />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.controlButton, styles.endCallButton]}
                onPress={onEndCall}
            >
                <Ionicons name="call" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.controlButton}
                onPress={onSwitchCamera}
            >
                <Ionicons name="camera-reverse" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.controlButton, showChat && styles.controlButtonActive]}
                onPress={onChat}
            >
                <Ionicons name="chatbubble" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

// 유틸리티 함수들
const getFileIcon = (type) => {
    switch (type) {
        case 'image': return 'image-outline';
        case 'video': return 'videocam-outline';
        case 'audio': return 'musical-notes-outline';
        case 'document': return 'document-outline';
        default: return 'document-outline';
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'sent': return 'checkmark-outline';
        case 'delivered': return 'checkmark-done-outline';
        case 'read': return 'checkmark-done';
        default: return 'time-outline';
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case 'sent': return theme.colors.text.secondary;
        case 'delivered': return theme.colors.text.secondary;
        case 'read': return theme.colors.primary.main;
        default: return theme.colors.text.hint;
    }
};


const styles = StyleSheet.create({
    // 메시지 버블 스타일
    messageBubbleContainer: {
        marginVertical: 4,
        maxWidth: '80%',
    },
    myMessage: {
        alignSelf: 'flex-end',
    },
    otherMessage: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        borderRadius: 16,
        padding: 12,
        maxWidth: '100%',
    },
    myBubble: {
        backgroundColor: theme.colors.primary.main,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: theme.colors.grey[200],
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: theme.typography.size.body1,
        lineHeight: theme.typography.lineHeight.body1,
    },
    myMessageText: {
        color: theme.colors.text.contrast,
    },
    otherMessageText: {
        color: theme.colors.text.primary,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
        gap: 4,
    },
    messageTime: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.hint,
    },
    fileContainer: {
        marginBottom: 8,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        marginBottom: 4,
    },
    fileName: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.contrast,
    },
    reactionsContainer: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 4,
    },
    reaction: {
        fontSize: theme.typography.size.body2,
        backgroundColor: theme.colors.background.primary,
        padding: 4,
        borderRadius: 12,
        ...theme.shadows.small,
    },

    // 채팅 입력 스타일
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 8,
        backgroundColor: theme.colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: theme.colors.grey[100],
        borderRadius: 24,
        marginHorizontal: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        fontSize: theme.typography.size.body1,
        maxHeight: 100,
        marginRight: 8,
        color: theme.colors.text.primary,
    },
    attachButton: {
        padding: 8,
    },
    cameraButton: {
        padding: 4,
    },
    sendButton: {
        padding: 8,
    },
    micButton: {
        padding: 8,
    },

    // 채팅방 리스트 아이템 스타일
    chatRoomItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    avatarContainer: {
        marginRight: 12,
    },
    memberCount: {
        position: 'absolute',
        right: -4,
        bottom: -4,
        backgroundColor: theme.colors.primary.main,
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    memberCountText: {
        color: theme.colors.text.contrast,
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
    },
    chatInfo: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        flex: 1,
    },
    chatTime: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.secondary,
        marginLeft: 8,
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
        flex: 1,
    },
    unreadBadge: {
        backgroundColor: theme.colors.primary.main,
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    unreadCount: {
        color: theme.colors.text.contrast,
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
    },

    // 화상 통화 컨트롤 스타일
    videoControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 32,
    },
    controlButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    endCallButton: {
        backgroundColor: theme.colors.status.error,
        transform: [{ rotate: '135deg' }],
    },
});

// 컴포넌트 내보내기
export default {
    MessageBubble,
    ChatInput,
    ChatRoomItem,
    VideoCallControls
};