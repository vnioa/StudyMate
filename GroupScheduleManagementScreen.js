// 10.그룹 일정 관리 페이지 
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';

const GroupScheduleManagementScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessions, setSessions] = useState([]);

    const addSession = () => {
        if (sessionTitle && selectedDate) {
            setSessions([...sessions, { id: Date.now().toString(), title: sessionTitle, date: selectedDate }]);
            setSessionTitle('');
            setSelectedDate('');
            setModalVisible(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>그룹 일정 관리 페이지</Text>

            {/* 그룹 일정 캘린더 뷰 */}
            <Calendar
                onDayPress={(day) => {
                    setSelectedDate(day.dateString);
                    setModalVisible(true);
                }}
                markedDates={{
                    [selectedDate]: { selected: true, marked: true, selectedColor: 'blue' },
                }}
            />

            {/* 학습 세션 목록 */}
            <Text style={styles.sessionTitle}>학습 세션 목록</Text>
            <FlatList
                data={sessions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.sessionItem}>
                        <Text style={styles.sessionText}>{item.title} - {item.date}</Text>
                    </View>
                )}
            />

            {/* Modal for Adding Session */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>세션 추가</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="세션 제목"
                        value={sessionTitle}
                        onChangeText={setSessionTitle}
                    />
                    <TouchableOpacity style={styles.submitButton} onPress={addSession}>
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
    sessionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    sessionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    sessionText: {
        fontSize: 16,
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
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
        width: '100%',
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

export default GroupScheduleManagementScreen; 