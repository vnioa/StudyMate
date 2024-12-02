//9. 학습 리소스 센터 페이지 
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';

const LearningResourceCenterScreen = () => {
    const [resources, setResources] = useState([]);
    const [resourceName, setResourceName] = useState('');
    const [resourceLink, setResourceLink] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    const [newsFeed, setNewsFeed] = useState([
        { id: '1', title: '2023년 온라인 학습 트렌드', content: '2023년에는 온라인 학습이 계속해서 강력하게 성장하고 있습니다.' },
        { id: '2', title: '효과적인 학습 방법', content: '새로운 학습 방법이 학습 성과를 향상시키는 데 도움을 줍니다.' },
    ]);

    const addResource = () => {
        if (resourceName && resourceLink) {
            setResources([...resources, { id: Date.now().toString(), name: resourceName, link: resourceLink }]);
            setResourceName('');
            setResourceLink('');
            setModalVisible(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>학습 리소스 센터</Text>

            {/* 온라인 강의 목록 및 추천 */}
            <Text style={styles.sectionTitle}>온라인 강의 목록 및 추천</Text>
            <FlatList
                data={resources}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.resourceItem}>
                        <Text style={styles.resourceName}>{item.name}</Text>
                        <Text style={styles.resourceLink}>{item.link}</Text>
                    </View>
                )}
            />

            {/* 리소스 추가 버튼 */}
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.buttonText}>리소스 추가</Text>
            </TouchableOpacity>

            {/* 외부 학습 리소스 링크 모음 */}
            <Text style={styles.sectionTitle}>외부 학습 리소스 링크 모음</Text>
            <ScrollView>
                <Text style={styles.externalLink}>- [Khan Academy](https://www.khanacademy.org)</Text>
                <Text style={styles.externalLink}>- [Coursera](https://www.coursera.org)</Text>
                <Text style={styles.externalLink}>- [edX](https://www.edx.org)</Text>
            </ScrollView>

            {/* 교육 트렌드 및 뉴스 피드 */}
            <Text style={styles.sectionTitle}>교육 트렌드 및 뉴스 피드</Text>
            <FlatList
                data={newsFeed}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.newsItem}>
                        <Text style={styles.newsTitle}>{item.title}</Text>
                        <Text style={styles.newsContent}>{item.content}</Text>
                    </View>
                )}
            />

            {/* 리소스 추가 모달 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>리소스 추가</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="리소스 이름"
                        value={resourceName}
                        onChangeText={setResourceName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="리소스 링크"
                        value={resourceLink}
                        onChangeText={setResourceLink}
                    />
                    <TouchableOpacity style={styles.submitButton} onPress={addResource}>
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    resourceItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    resourceName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    resourceLink: {
        fontSize: 14,
        color: 'blue',
    },
    addButton: {
        backgroundColor: '#4A90E2',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    externalLink: {
        fontSize: 16,
        marginVertical: 5,
    },
    newsItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    newsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    newsContent: {
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

export default LearningResourceCenterScreen; 