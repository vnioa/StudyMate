// src/components/Chat/ReadReceipt.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const ReadReceipt = ({ isRead, readByUsers = [] }) => {
    return (
        <View style={styles.container}>
            {isRead ? (
                <View style={styles.readIndicator}>
                    <FontAwesome name="check-circle" size={14} color="#4caf50" />
                    <Text style={styles.readText}>Read by {readByUsers.length}</Text>
                </View>
            ) : (
                <View style={styles.unreadIndicator}>
                    <FontAwesome name="check-circle-o" size={14} color="#888" />
                    <Text style={styles.unreadText}>Unread</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    readIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unreadIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    readText: {
        fontSize: 12,
        color: '#4caf50',
        marginLeft: 4,
    },
    unreadText: {
        fontSize: 12,
        color: '#888',
        marginLeft: 4,
    },
});

export default ReadReceipt;
