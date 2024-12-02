// 8.그룹 커뮤니케이션 페이지 
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';

const GroupCommunicationScreen = () => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [discussion, setDiscussion] = useState('');
    const [pollQuestion, setPollQuestion] = useState('');

    const sendMessage = () => {
        if (message) {
            setMessages([...messages, { id: Date.now().toString(), text: message }]);
            setMessage('');
        }
    };

    const submitDiscussion = () => {
        alert(`토론 내용이 제출되었습니다: ${discussion}`);
        setDiscussion('');
        setModalVisible(false);
    };

    const createPoll = () => {
        alert(`투표 질문: ${pollQuestion}`);
        setPollQuestion('');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>그룹 커뮤니케이션 페이지</Text>

            {/* Chat Section */}
            <View style={styles.chatContainer}>
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <Text style={styles.message}>{item.text}</Text>}
                />
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="메시지를 입력하세요"
                        value={message}
                        onChangeText={setMessage}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                        <Text style={styles.buttonText}>전송</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Discussion Board Button */}
            <TouchableOpacity style={styles.discussionButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.buttonText}>토론 게시판 열기</Text>
            </TouchableOpacity>

            {/* Poll Section */}
            <View style={styles.pollContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="투표 질문 입력"
                    value={pollQuestion}
                    onChangeText={setPollQuestion}
                />
                <TouchableOpacity style={styles.createPollButton} onPress={createPoll}>
                    <Text style={styles.buttonText}>투표 생성</Text>
                </TouchableOpacity>
            </View>

            {/* Discussion Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>토론 내용 입력</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="토론 내용을 입력하세요"
                        value={discussion}
                        onChangeText={setDiscussion}
                    />
                    <TouchableOpacity style={styles.submitButton} onPress={submitDiscussion}>
                        <Text style={styles.buttonText}>제출</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                        <Text style={styles.buttonText}>닫기</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    chatContainer: {
        flex: 1,
        marginBottom: 20,
    },
    message: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#4A90E2',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    discussionButton: {
        backgroundColor: '#FF9800',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    pollContainer: {
        marginTop: 10,
    },
    createPollButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 5,
        padding: 10,
        marginTop: 10,
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 5,
        padding: 10,
        marginTop: 10,
    },
    closeButton: {
        backgroundColor: '#E53935',
        borderRadius: 5,
        padding: 10,
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default GroupCommunicationScreen; 