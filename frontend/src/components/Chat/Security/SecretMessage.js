import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const SecretMessage = ({ message }) => {
    const [isHidden, setIsHidden] = useState(true);

    const toggleVisibility = () => setIsHidden(!isHidden);

    return (
        <View style={styles.container}>
            {isHidden ? (
                <Text style={styles.hiddenText}>*** Secret Message Hidden ***</Text>
            ) : (
                <Text style={styles.messageText}>{message}</Text>
            )}
            <Button title={isHidden ? "Show" : "Hide"} onPress={toggleVisibility} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 10 },
    hiddenText: { color: '#d9534f' },
    messageText: { color: '#333' },
});

export default SecretMessage;
