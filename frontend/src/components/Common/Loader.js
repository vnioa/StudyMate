// src/components/Common/Loader.js

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';

const Loader = ({ visible = false, message = 'Loading...' }) => {
    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={styles.container}>
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#007bff" />
                    {message ? <Text style={styles.message}>{message}</Text> : null}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        width: 120,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
});

export default Loader;
