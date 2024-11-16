// features/social/screens/chat/ChatRoomScreen/components/MessageInput.js
import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Platform,
    Keyboard,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useChat } from '../../../../hooks/useChat';
import styles from '../styles';

const MessageInput = ({ chatId, onTyping }) => {
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const { sendMessage, uploadFile } = useChat();

    // 메시지 전송 처리
    const handleSend = useCallback(async () => {
        if (!message.trim() && !isUploading) return;

        try {
            await sendMessage(chatId, {
                content: message.trim(),
                type: 'text',
                createdAt: new Date().toISOString()
            });
            setMessage('');
            Keyboard.dismiss();
        } catch (error) {
            Alert.alert('오류', '메시지 전송에 실패했습니다.');
        }
    }, [chatId, message, sendMessage, isUploading]);

    // 입력 변경 처리
    const handleChangeText = useCallback((text) => {
        setMessage(text);

        // 타이핑 상태 처리
        if (onTyping) {
            onTyping(true);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                onTyping(false);
            }, 3000);
        }
    }, [onTyping]);

    // 파일 선택 처리
    const handleFilePick = useCallback(async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploading(true);
                const file = {
                    uri: result.assets[0].uri,
                    type: `image/${result.assets[0].uri.split('.').pop()}`,
                    name: `image-${Date.now()}.${result.assets[0].uri.split('.').pop()}`
                };

                await uploadFile(chatId, file, (progress) => {
                    console.log('Upload progress:', progress);
                });
            }
        } catch (error) {
            Alert.alert('오류', '파일 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    }, [chatId, uploadFile]);

    // 카메라 실행
    const handleCamera = useCallback(async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploading(true);
                const file = {
                    uri: result.assets[0].uri,
                    type: 'image/jpeg',
                    name: `camera-${Date.now()}.jpg`
                };

                await uploadFile(chatId, file, (progress) => {
                    console.log('Upload progress:', progress);
                });
            }
        } catch (error) {
            Alert.alert('오류', '카메라 사용 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    }, [chatId, uploadFile]);

    return (
        <View style={styles.inputContainer}>
            <View style={styles.inputActionsLeft}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCamera}
                    disabled={isUploading}
                >
                    <Ionicons name="camera-outline" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleFilePick}
                    disabled={isUploading}
                >
                    <Ionicons name="image-outline" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <TextInput
                ref={inputRef}
                style={styles.input}
                value={message}
                onChangeText={handleChangeText}
                placeholder="메시지를 입력하세요..."
                placeholderTextColor="#999"
                multiline
                maxLength={1000}
                returnKeyType="default"
                blurOnSubmit={false}
                enablesReturnKeyAutomatically
                editable={!isUploading}
            />

            <View style={styles.inputActionsRight}>
                {isUploading ? (
                    <ActivityIndicator color="#0057D9" style={styles.sendButton} />
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !message.trim() && styles.sendButtonDisabled
                        ]}
                        onPress={handleSend}
                        disabled={!message.trim()}
                    >
                        <Ionicons
                            name="send"
                            size={24}
                            color={message.trim() ? "#0057D9" : "#999"}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

MessageInput.defaultProps = {
    onTyping: null
};

export default React.memo(MessageInput);