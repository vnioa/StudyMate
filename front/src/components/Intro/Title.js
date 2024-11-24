import React, { useEffect } from 'react';
import { Animated, Text } from 'react-native';
import styles from '../../styles/IntroScreenStyles';

const Title = () => {
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Animated.Easing.ease,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
            StudyMate
        </Animated.Text>
    );
};

export default Title;