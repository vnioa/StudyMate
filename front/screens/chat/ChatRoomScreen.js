import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, FlatList, Animated, Alert, SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import DocumentPicker from 'react-native-document-picker';
import {API_URL} from "../../config/api";

const ChatRoomScreen = ({ navigation, route }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [recording, setRecording] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [newMessageAlert, setNewMessageAlert] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchMessages();
        Voice.onSpeechResults = handleVoiceResults;
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_URL}/api`);
            const data = await response.json();
            setMessages(data);
            scrollToEnd();
        } catch (error) {
            console.error(error);
        }
    };

    const sendMessage = async () => {
        if (!inputText) return;
        const newMessage = {
            id: Date.now().toString(),
            text: inputText,
            sent: true,
            timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setInputText('');
        scrollToEnd();
        try {
            await fetch(`${API_URL}/api`, {
                method: 'POST',
                body: JSON.stringify(newMessage),
            });
        } catch (error) {
            console.error(error);
        }
    };

    const startRecording = () => {
        Voice.start('en-US');
        setRecording(true);
    };

    const stopRecording = () => {
        Voice.stop();
        setRecording(false);
    };

    const handleVoiceResults = (result) => {
        const text = result.value[0];
        setInputText((prev) => prev + ' ' + text);
    };

    const handleAttachmentSelection = async () => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.images, DocumentPicker.types.video],
            });
            if (result) {
                Alert.alert('첨부 파일', '파일이 성공적으로 선택되었습니다.');
            }
        } catch (error) {
            if (DocumentPicker.isCancel(error)) {
                console.log('첨부 취소됨');
            } else {
                console.error(error);
            }
        }
    };

    const renderItem = ({ item }) => (
        <View style={item.sent ? styles.sentMessage : styles.receivedMessage}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.timestamp}>{item.timestamp.toLocaleTimeString()}</Text>
        </View>
    );

    const scrollToEnd = () => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
            setIsAtBottom(true);
        }
    };

    const onScroll = (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const contentHeight = event.nativeEvent.contentSize.height;
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;
        if (offsetY + layoutHeight >= contentHeight - 20) {
            setIsAtBottom(true);
            setNewMessageAlert(false);
        } else {
            setIsAtBottom(false);
        }
    };

    const newMessageAlertBanner = () => (
        <TouchableOpacity style={styles.newMessageAlert} onPress={scrollToEnd}>
            <Text style={styles.newMessageText}>새 메시지 도착</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* 상단 바 */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#757575" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Image source={{ uri: route.params.profileImage }} style={styles.profileImage} />
                    <Text style={styles.headerText}>{route.params.name}</Text>
                </View>
                <TouchableOpacity style={styles.callButton}>
                    <Ionicons name="call" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <MaterialIcons name="more-vert" size={24} color="#757575" />
                </TouchableOpacity>
            </View>

            {/* 메시지 목록 */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.messageContainer}
                onContentSizeChange={() => isAtBottom && scrollToEnd()}
                onScroll={onScroll}
            />

            {!isAtBottom && newMessageAlert && newMessageAlertBanner()}

            {/* 하단 입력창 */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.inputContainer}>
                    <TouchableOpacity onPress={handleAttachmentSelection}>
                        <MaterialIcons name="attach-file" size={24} color="#757575" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="메시지를 입력하세요"
                        value={inputText}
                        onChangeText={(text) => setInputText(text)}
                        multiline
                    />
                    <TouchableOpacity onPress={startRecording} onLongPress={stopRecording}>
                        <FontAwesome name="microphone" size={24} color={recording ? '#FF6B6B' : '#757575'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={sendMessage} style={styles.fabButton}>
                        <Ionicons name="send" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F9F9' },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 15 },
    profileImage: { width: 40, height: 40, borderRadius: 20 },
    backButton: { padding: 10 },
    callButton: { padding: 10, backgroundColor: '#4A90E2', borderRadius: 20 },
    messageContainer: { padding: 10 },
    sentMessage: { alignSelf: 'flex-end', backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10, marginVertical: 5 },
    receivedMessage: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, marginVertical: 5 },
    messageText: { fontSize: 16 },
    timestamp: { fontSize: 12, color: '#757575', alignSelf: 'flex-end' },
    newMessageAlert: { backgroundColor: '#FF6B6B', padding: 10, borderRadius: 5, position: 'absolute', top: 10, alignSelf: 'center' },
    newMessageText: { color: '#FFFFFF', fontWeight: 'bold' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#FFFFFF' },
    input: { flex: 1, fontSize: 16, color: '#333333' },
    fabButton: { padding: 10, backgroundColor: '#4A90E2', borderRadius: 30, paddingHorizontal: 15, marginLeft: 10 },
});

export default ChatRoomScreen;
