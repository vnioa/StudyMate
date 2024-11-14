// 사진 앨범 전송 기능

import React from 'react';
import { View, Button, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadAlbum } from '../../api/chat';

const AlbumUpload = ({ chatId }) => {
    const handleAlbumSelect = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            quality: 0.5,
        });
        if (!result.cancelled) {
            try {
                await uploadAlbum(chatId, result.selected);
                Alert.alert('앨범이 성공적으로 전송되었습니다.');
            } catch (error) {
                Alert.alert('앨범 전송 실패', error.message);
            }
        }
    };

    return (
        <View>
            <Button title="앨범 선택 및 전송" onPress={handleAlbumSelect} />
        </View>
    );
};

export default AlbumUpload;
