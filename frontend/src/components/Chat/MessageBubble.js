// src/components/Chat/MessageBubble.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MessageBubble = ({ message, isSender }) => {
    return (
        <View style={[styles.container, isSender ? styles.senderContainer : styles.receiverContainer]}>
            <Text style={styles.messageText}>{message.text}</Text>
            <View style={styles.footer}>
                <Text style={styles.timestamp}>{message.timestamp}</Text>
                {isSender && message.isRead && <Text style={styles.readStatus}>Read</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 10,
        marginVertical: 5,
    },
    senderContainer: {
        backgroundColor: '#DCF8C5',
        alignSelf: 'flex-end',
    },
    receiverContainer: {
        backgroundColor: '#FFF',
        alignSelf: 'flex-start',
    },
    messageText: {
        fontSize: 16,
        color: '#000',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 5,
    },
    timestamp: {
        fontSize: 10,
        color: '#666',
        marginRight: 5,
    },
    readStatus: {
        fontSize: 10,
        color: '#007bff',
    },
});

export default MessageBubble;
