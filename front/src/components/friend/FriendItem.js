import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FriendItem = ({ friend, onChatPress, onProfilePress, onMorePress }) => {
    const { name, status, profileImage, isOnline } = friend;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onProfilePress}
        >
            <View style={styles.leftContainer}>
                <View style={styles.imageContainer}>
                    <Image
                        source={profileImage ? { uri: profileImage } : require('../../../assets/default-profile.png')}
                        style={styles.profileImage}
                    />
                    {isOnline && <View style={styles.onlineIndicator} />}
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.status}>{status}</Text>
                </View>
            </View>

            <View style={styles.rightContainer}>
                <TouchableOpacity
                    style={styles.chatButton}
                    onPress={onChatPress}
                >
                    <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.moreButton}
                    onPress={onMorePress}
                >
                    <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA'
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    imageContainer: {
        position: 'relative'
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12
    },
    onlineIndicator: {
        position: 'absolute',
        right: 14,
        bottom: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CD964',
        borderWidth: 2,
        borderColor: '#fff'
    },
    infoContainer: {
        justifyContent: 'center'
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4
    },
    status: {
        fontSize: 14,
        color: '#666'
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    chatButton: {
        padding: 8,
        marginRight: 8
    },
    moreButton: {
        padding: 8
    }
});

export default FriendItem;