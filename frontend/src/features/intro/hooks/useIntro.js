// screens/intro/hooks/useIntro.js
import { useEffect } from 'react';
import { Animated, Easing } from 'react-native';

export const useIntro = () => {
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
        }).start();
    }, []);

    return {
        fadeAnim
    };
};