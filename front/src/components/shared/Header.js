import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const Header = ({ title, showBack = true, rightButton }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {showBack && (
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={28} color="#007AFF" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>
                    {title}
                </Text>
            </View>

            <View style={styles.rightContainer}>
                {rightButton && (
                    <TouchableOpacity
                        onPress={rightButton.onPress}
                        style={styles.rightButton}
                    >
                        {rightButton.icon ? (
                            <Ionicons name={rightButton.icon} size={24} color="#007AFF" />
                        ) : (
                            <Text style={styles.rightButtonText}>{rightButton.text}</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: Platform.OS === 'ios' ? 44 : 56,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        ...Platform.select({
            ios: {
                paddingTop: 0
            },
            android: {
                elevation: 4
            }
        })
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start'
    },
    titleContainer: {
        flex: 2,
        alignItems: 'center'
    },
    rightContainer: {
        flex: 1,
        alignItems: 'flex-end'
    },
    backButton: {
        padding: 8,
        marginLeft: -8
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000'
    },
    rightButton: {
        padding: 8,
        marginRight: -8
    },
    rightButtonText: {
        fontSize: 16,
        color: '#007AFF'
    }
});

export default Header;