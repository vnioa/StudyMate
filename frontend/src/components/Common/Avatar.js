// src/components/Common/Avatar.js

import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const Avatar = ({ imageUrl, size = 50, name }) => {
    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
            {imageUrl ? (
                <Image
                    source={typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl}
                    style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
                />
            ) : (
                <Image
                    source={require('../../../assets/icons/user.png')}
                    style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
    },
    image: {
        resizeMode: 'cover',
    },
});

export default Avatar;
