// features/social/screens/chat/ChatSettingsScreen/components/ChatInfo.js
import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import styles from '../styles';

const ChatInfo = ({
                      chat,
                      isEditing,
                      onUpdate,
                      lastUpdated
                  }) => {
    const [title, setTitle] = useState(chat.title);
    const [description, setDescription] = useState(chat.description || '');
    const [thumbnail, setThumbnail] = useState(chat.thumbnail);

    // 이미지 선택
    const handleImagePick = useCallback(async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('권한 필요', '이미지를 선택하기 위해 갤러리 접근 권한이 필요합니다.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                setThumbnail(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
        }
    }, []);

    // 변경사항 저장
    const handleSave = useCallback(() => {
        if (!title.trim()) {
            Alert.alert('알림', '채팅방 이름을 입력해주세요.');
            return;
        }

        const updates = {
            title: title.trim(),
            description: description.trim(),
            thumbnail,
            updatedAt: new Date().toISOString()
        };

        onUpdate(updates);
    }, [title, description, thumbnail, onUpdate]);

    // 마지막 업데이트 시간 포맷팅
    const formattedLastUpdate = lastUpdated
        ? format(new Date(lastUpdated), 'yyyy년 M월 d일 HH:mm', { locale: ko })
        : null;

    return (
        <View style={styles.infoContainer}>
            <TouchableOpacity
                style={styles.thumbnailContainer}
                onPress={isEditing ? handleImagePick : undefined}
                disabled={!isEditing}
            >
                <Image
                    source={
                        thumbnail
                            ? { uri: thumbnail }
                            : require('../../../../../../assets/icons/group.png')
                    }
                    style={styles.thumbnail}
                />
                {isEditing && (
                    <View style={styles.editOverlay}>
                        <Ionicons name="camera" size={24} color="#FFFFFF" />
                    </View>
                )}
            </TouchableOpacity>

            <View style={styles.infoContent}>
                {isEditing ? (
                    <TextInput
                        style={styles.titleInput}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="채팅방 이름 입력"
                        placeholderTextColor="#8E8E93"
                        maxLength={50}
                    />
                ) : (
                    <Text style={styles.title}>{chat.title}</Text>
                )}

                {isEditing ? (
                    <TextInput
                        style={styles.descriptionInput}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="채팅방 설명 입력 (선택사항)"
                        placeholderTextColor="#8E8E93"
                        multiline
                        maxLength={200}
                    />
                ) : (
                    chat.description && (
                        <Text style={styles.description}>{chat.description}</Text>
                    )
                )}

                {formattedLastUpdate && (
                    <Text style={styles.lastUpdated}>
                        마지막 업데이트: {formattedLastUpdate}
                    </Text>
                )}

                {isEditing && (
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>변경사항 저장</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{chat.participantsCount || 0}</Text>
                    <Text style={styles.statLabel}>참가자</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{chat.messageCount || 0}</Text>
                    <Text style={styles.statLabel}>메시지</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {format(new Date(chat.createdAt), 'yy.MM.dd')}
                    </Text>
                    <Text style={styles.statLabel}>생성일</Text>
                </View>
            </View>
        </View>
    );
};

ChatInfo.defaultProps = {
    isEditing: false,
    onUpdate: null
};

export default memo(ChatInfo);