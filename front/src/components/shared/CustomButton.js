import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

const CustomButton = ({
                          onPress,
                          title,
                          type = 'primary',
                          disabled = false,
                          icon,
                          textStyle,
                          buttonStyle
                      }) => {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.button,
                styles[`${type}Button`],
                pressed && styles.buttonPressed,
                disabled && styles.buttonDisabled,
                buttonStyle
            ]}
            accessible
            accessibilityLabel={title}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
        >
            {icon && icon}
            <Text style={[
                styles.text,
                styles[`${type}Text`],
                disabled && styles.textDisabled,
                textStyle
            ]}>
                {title}
            </Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        elevation: 3,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    secondaryButton: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    dangerButton: {
        backgroundColor: '#FF3B30',
    },
    buttonPressed: {
        opacity: 0.8,
    },
    buttonDisabled: {
        backgroundColor: '#E5E5EA',
        elevation: 0,
    },
    text: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '600',
        letterSpacing: 0.25,
        marginLeft: 8,
    },
    primaryText: {
        color: '#FFFFFF',
    },
    secondaryText: {
        color: '#007AFF',
    },
    dangerText: {
        color: '#FFFFFF',
    },
    textDisabled: {
        color: '#8E8E93',
    },
});

export default CustomButton;