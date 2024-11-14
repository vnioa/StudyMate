// src/components/Chat/MediaPreview.js

import React, { useState } from 'react';
import { View, Modal, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Video } from 'expo-av';

const MediaPreview = ({ media }) => {
    const [modalVisible, setModalVisible] = useState(false);

    // 미디어 유형 확인 (이미지 또는 비디오)
    const isImage = media.type === 'image';
    const isVideo = media.type === 'video';

    return (
        <View style={styles.container}>
            {/* 미디어 미리보기 */}
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.thumbnailContainer}>
                {isImage && <Image source={{ uri: media.uri }} style={styles.thumbnail} />}
                {isVideo && (
                    <Video
                        source={{ uri: media.uri }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                        isMuted
                        shouldPlay={false}
                    />
                )}
            </TouchableOpacity>

            {/* 전체 화면 모달 */}
            <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                    {isImage && <Image source={{ uri: media.uri }} style={styles.fullscreenImage} />}
                    {isVideo && (
                        <Video
                            source={{ uri: media.uri }}
                            style={styles.fullscreenVideo}
                            resizeMode="contain"
                            useNativeControls
                            isLooping
                            shouldPlay
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbnailContainer: {
        width: 100,
        height: 100,
        margin: 5,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    fullscreenVideo: {
        width: '100%',
        height: '100%',
    },
});

export default MediaPreview;
