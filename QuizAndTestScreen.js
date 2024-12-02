// 6.퀴즈 및 테스트 페이지 ok 
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';

const QuizAndTestScreen = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [quizTitle, setQuizTitle] = useState('');
    const [quizType, setQuizType] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [points, setPoints] = useState(0);
    const [badges, setBadges] = useState([]);

    const addQuiz = () => {
        if (quizTitle && quizType) {
            setQuizzes([...quizzes, { id: Date.now().toString(), title: quizTitle, type: quizType }]);
            setQuizTitle('');
            setQuizType('');
        }
    };

    const viewQuiz = (quiz) => {
        setSelectedQuiz(quiz);
        setModalVisible(true);
    };

    const deleteQuiz = (id) => {
        setQuizzes(quizzes.filter(quiz => quiz.id !== id));
        alert('퀴즈가 삭제되었습니다.');
    };

    const analyzeResults = (quiz) => {
        // 결과 분석 및 오답 노트 생성 로직
        alert(`퀴즈: ${quiz.title}의 결과가 분석되었습니다.`);
    };

    const suggestReviewPlan = () => {
        // 맞춤형 복습 계획 제안 로직
        alert('복습 계획이 제안되었습니다.');
    };

    const earnPoints = () => {
        setPoints(points + 10); // 포인트 추가
        alert('10 포인트를 받았습니다!');
    };

    const earnBadge = (badge) => {
        setBadges([...badges, badge]);
        alert(`배지를 받았습니다: ${badge}`);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>퀴즈 및 테스트 페이지</Text>
            <TextInput
                style={styles.input}
                placeholder="퀴즈 제목 입력"
                value={quizTitle}
                onChangeText={setQuizTitle}
            />
            <TextInput
                style={styles.input}
                placeholder="퀴즈 유형 입력 (예: 다지선다형)"
                value={quizType}
                onChangeText={setQuizType}
            />
            <TouchableOpacity style={styles.addButton} onPress={addQuiz}>
                <Text style={styles.buttonText}>퀴즈 추가</Text>
            </TouchableOpacity>
            <FlatList
                data={quizzes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.quizItem}>
                        <TouchableOpacity onPress={() => viewQuiz(item)}>
                            <Text style={styles.quizName}>{item.title} ({item.type})</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteQuiz(item.id)}>
                            <Text style={styles.deleteText}>삭제</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>퀴즈: {selectedQuiz?.title}</Text>
                    <Text style={styles.modalText}>유형: {selectedQuiz?.type}</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.buttonText}>닫기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.analyzeButton}
                        onPress={() => analyzeResults(selectedQuiz)}
                    >
                        <Text style={styles.buttonText}>결과 분석</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={suggestReviewPlan}
                    >
                        <Text style={styles.buttonText}>복습 계획 제안</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
            <View style={styles.gamificationContainer}>
                <Text style={styles.pointsText}>포인트: {points}</Text>
                <TouchableOpacity style={styles.badgeButton} onPress={() => earnBadge('퀴즈 마스터')}>
                    <Text style={styles.buttonText}>배지 받기</Text>
                </TouchableOpacity>
            </View>
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
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: '#4A90E2',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    quizItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    quizName: {
        fontSize: 16,
    },
    deleteText: {
        color: 'red',
        fontWeight: 'bold',
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
    analyzeButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 5,
        padding: 10,
        marginTop: 10,
    },
    reviewButton: {
        backgroundColor: '#FF9800',
        borderRadius: 5,
        padding: 10,
        marginTop: 10,
    },
    gamificationContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    pointsText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    badgeButton: {
        backgroundColor: '#FFC107',
        borderRadius: 5,
        padding: 10,
        marginTop: 10,
    },
});

export default QuizAndTestScreen; 