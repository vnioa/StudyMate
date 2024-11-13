import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UserStatusIndicator = ({ status }) => (
    <View style={styles.container}>
        <View style={[styles.indicator, { backgroundColor: status === 'online' ? 'green' : 'gray' }]} />
        <Text style={styles.statusText}>{status === 'online' ? '온라인' : '오프라인'}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center' },
    indicator: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
    statusText: { fontSize: 12, color: 'gray' },
});

export default UserStatusIndicator;
