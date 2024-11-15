// features/home/components/WelcomeSection/WelcomeMessage.js
import React from 'react';
import { View, Text } from 'react-native';
import { useWelcome } from '../../hooks/useWelcome';
import styles from './styles';

const WelcomeMessage = () => {
    const { userName, timeBasedMessage } = useWelcome();

    return (
        <View style={styles.messageContainer}>
            <Text style={styles.greeting}>안녕하세요, {userName}님!</Text>
            <Text style={styles.message}>{timeBasedMessage}</Text>
        </View>
    );
};

export default WelcomeMessage;