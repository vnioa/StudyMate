// 7.성과 분석 페이지 ok
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const PerformanceAnalysisScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const subjects = [
        { id: '1', name: '수학', studyTime: 120, goal: 150 },
        { id: '2', name: '과학', studyTime: 90, goal: 100 },
        { id: '3', name: '영어', studyTime: 60, goal: 80 },
        // 추가 과목 데이터
    ];

    const data = {
        labels: subjects.map(subject => subject.name),
        datasets: [
            {
                data: subjects.map(subject => (subject.studyTime / subject.goal) * 100),
            },
        ],
    };

    const renderSubjectItem = ({ item }) => (
        <TouchableOpacity style={styles.subjectItem} onPress={() => {
            setSelectedSubject(item);
            setModalVisible(true);
        }}>
            <Text style={styles.subjectName}>{item.name}</Text>
            <Text style={styles.studyTime}>학습 시간: {item.studyTime}분</Text>
            <Text style={styles.goal}>목표: {item.goal}분</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>성과 분석 페이지</Text>
            <BarChart
                data={data}
                width={400}
                height={220}
                chartConfig={{
                    backgroundColor: '#e26a00',
                    backgroundGradientFrom: '#fb8c00',
                    backgroundGradientTo: '#ffa726',
                    decimalPlaces: 2,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: {
                        borderRadius: 16,
                    },
                    propsForDots: {
                        r: '6',
                        strokeWidth: '2',
                        stroke: '#ffa726',
                    },
                }}
                style={{
                    marginVertical: 8,
                    borderRadius: 16,
                }}
            />
            <FlatList
                data={subjects}
                keyExtractor={(item) => item.id}
                renderItem={renderSubjectItem}
            />
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>과목: {selectedSubject?.name}</Text>
                    <Text style={styles.modalText}>학습 시간: {selectedSubject?.studyTime}분</Text>
                    <Text style={styles.modalText}>목표: {selectedSubject?.goal}분</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                    >
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
    subjectItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    subjectName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    studyTime: {
        fontSize: 14,
        color: '#555',
    },
    goal: {
        fontSize: 14,
        color: '#555',
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
    closeButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 5,
        padding: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default PerformanceAnalysisScreen; 