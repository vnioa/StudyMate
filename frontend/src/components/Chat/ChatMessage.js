import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ReplyMessage from './ReplyMessage';
import MessageTag from './MessageTag';
import UserStatusIndicator from './UserStatusIndicator';

const ChatMessage = ({ message, isRead, onReply, tags, onDelete, userStatus }) => (
    <View style={styles.messageContainer}>
        <UserStatusIndicator status={userStatus} />
        {message.replyTo && <ReplyMessage replyTo={message.replyTo} />}
        <Text style={styles.messageText}>{message.content}</Text>
        <MessageTag tags={tags} />
        {isRead && <Text style={styles.readStatus}>읽음</Text>}
        <View style={styles.actions}>
            <TouchableOpacity onPress={() => onReply(message)}>
                <Text style={styles.actionText}>답장</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(message.id)}>
                <Text style={styles.actionText}>삭제</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const styles = StyleSheet.create({
    messageContainer: { padding: 8, borderRadius: 5, backgroundColor: '#f1f1f1', marginVertical: 4 },
    messageText: { fontSize: 16, marginVertical: 4 },
    readStatus: { fontSize: 12, color: 'gray' },
    actions: { flexDirection: 'row', marginTop: 5 },
    actionText: { color: '#007aff', marginHorizontal: 5 },
});

export default ChatMessage;
