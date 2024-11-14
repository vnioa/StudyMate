// src/components/Chat/ReplyMessage.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ReplyMessage = ({ originalMessage, onCancel }) => {
    return (
        <View style={styles.container}>
            <View style={styles.replyContent}>
                <Text style={styles.replySender}>{originalMessage.sender}</Text>
                <Text style={styles.replyText} numberOfLines={1}>
                    {originalMessage.text}
                </Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>✕</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    replyContent: {
        flex: 1,
    },
    replySender: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    replyText: {
        fontSize: 14,
        color: '#555',
    },
    cancelButton: {
        marginLeft: 10,
        paddingHorizontal: 6,
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#888',
    },
});

export default ReplyMessage;
