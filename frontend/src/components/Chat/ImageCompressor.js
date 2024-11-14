// 사진 자동 압축 기능

import React from 'react';
import { View, Button, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { compressImage } from '../../api/chat';

const ImageCompressor = ({ chatId }) => {
    const handleImageSelect = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
        if (!result.cancelled) {
            try {
                const compressedImage = await compressImage(result);
                await uploadFile(chatId, compressedImage);
                Alert.alert('압축된 이미지가 성공적으로 전송되었습니다.');
            } catch (error) {
                Alert.alert('이미지 전송 실패', error.message);
            }
        }
    };

    return (
        <View>
            <Button title="사진 선택 및 압축 전송" onPress={handleImageSelect} />
        </View>
    );
};

export default ImageCompressor;
