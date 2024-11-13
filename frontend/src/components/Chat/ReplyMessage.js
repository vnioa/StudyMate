// components/ReplyMessage.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ReplyMessage = ({ message, onReply, originalMessage }) => {
    return (
        <View style={styles.replyContainer}>
            {originalMessage && (
                <View style={styles.originalMessageContainer}>
                    <Text style={styles.originalMessageText}>{originalMessage}</Text>
                </View>
            )}
            <View style={styles.replyInputContainer}>
                <Text style={styles.replyMessageText}>{message}</Text>
                <TouchableOpacity onPress={() => onReply(message)}>
                    <Text style={styles.replyButtonText}>Reply</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    replyContainer: {
        padding: 8,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    originalMessageContainer: {
        backgroundColor: '#f0f0f0',
        padding: 5,
    },
    originalMessageText: {
        color: '#555',
    },
    replyInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 5,
    },
    replyMessageText: {
        color: '#000',
        flex: 1,
    },
    replyButtonText: {
        color: '#007AFF',
        marginLeft: 10,
    },
});

export default ReplyMessage;
