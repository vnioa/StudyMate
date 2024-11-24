import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import styles from '../../styles/IntroScreenStyles';

const IntroButton = ({ text, onPress, style }) => (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
        <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
);

export default IntroButton;