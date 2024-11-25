import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const MessageInput = ({ onSendMessage, onFileUpload }) => {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const inputRef = useRef(null);

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message.trim(), 'text');
            setMessage('');
        }
    };

    const handleFileSelection = async () => {
        try {
            // 권한 요청
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                alert('파일 접근 권한이 필요합니다.');
                return;
            }

            // 이미지 선택
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled) {
                onFileUpload(result.assets[0]);
            }
        } catch (error) {
            console.error('파일 선택 오류:', error);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handleFileSelection} style={styles.button}>
                <Ionicons name="attach" size={24} color="#007AFF" />
            </TouchableOpacity>

            <TextInput
                ref={inputRef}
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="메시지를 입력하세요"
                multiline
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={handleSend}
            />

            <TouchableOpacity
                onPress={handleSend}
                style={[styles.button, !message.trim() && styles.buttonDisabled]}
                disabled={!message.trim()}
            >
                <Ionicons
                    name="send"
                    size={24}
                    color={message.trim() ? "#007AFF" : "#C7C7CC"}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        ...Platform.select({
            ios: {
                paddingBottom: 30 // iOS 하단 여백 조정
            }
        })
    },
    input: {
        flex: 1,
        marginHorizontal: 10,
        paddingHorizontal: 15,
        paddingVertical: 8,
        maxHeight: 100,
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        fontSize: 16
    },
    button: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonDisabled: {
        opacity: 0.5
    }
});

export default MessageInput;