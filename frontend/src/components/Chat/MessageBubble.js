import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const MessageBubble = ({ message }) => {
    const fadeAnim = new Animated.Value(0);

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={{ ...styles.bubble, opacity: fadeAnim }}>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    bubble: {
        backgroundColor: '#e1ffc7',
        borderRadius: 15,
        padding: 10,
        marginVertical: 5,
        maxWidth: '80%',
    },
    text: { fontSize: 16 },
});

export default MessageBubble;
