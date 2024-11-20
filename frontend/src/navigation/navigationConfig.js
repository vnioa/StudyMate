// src/navigation/navigationConfig.js
import { Platform } from 'react-native';

export const defaultScreenOptions = {
    headerShown: false,
    cardStyle: { backgroundColor: '#FFFFFF' },
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    ...Platform.select({
        ios: {
            gestureResponseDistance: { horizontal: 50 }
        }
    })
};

export const modalScreenOptions = {
    headerShown: false,
    cardStyle: { backgroundColor: '#FFFFFF' },
    presentation: 'modal',
    gestureEnabled: true,
    gestureDirection: 'vertical',
    ...Platform.select({
        ios: {
            gestureResponseDistance: { vertical: 100 }
        }
    })
};

export const navigationTheme = {
    dark: false,
    colors: {
        primary: '#0057D9',
        background: '#FFFFFF',
        card: '#FFFFFF',
        text: '#000000',
        border: '#E5E5EA',
        notification: '#FF3B30'
    }
};