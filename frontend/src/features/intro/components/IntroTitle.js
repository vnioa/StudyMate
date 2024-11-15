// screens/intro/components/IntroTitle.js
import React from 'react';
import { Animated } from 'react-native';
import styles from '../styles';

const IntroTitle = ({ fadeAnim }) => {
    return (
        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
            StudyMate
        </Animated.Text>
    );
};

export default React.memo(IntroTitle);