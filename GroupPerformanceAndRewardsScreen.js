// 11.그룹 성과 및 보상 페이지 
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';

const GroupPerformanceAndRewardsScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState(null);

    const achievements = [
        { id: '1', title: '첫 번째 목표 달성', badge: '🏆', level: 1 },
        { id: '2', title: '100시간 학습', badge: '🎓', level: 2 },
        { id: '3', title: '리더보드 1위', badge: '🥇', level: 3 },
    ];

    const rewards = [
        { id: '1', title: '가상 화폐 1000점', description: '1000점의 가상 화폐를 받습니다.' },
        { id: '2', title: '특권: 프리미엄 콘텐츠', description: '프리미엄 콘텐츠에 접근할 수 있는 특권을 받습니다.' },
    ];

    const renderAchievement = ({ item }) => (
        <TouchableOpacity onPress={() => { setSelectedAchievement(item); setModalVisible(true); }}>
            <View style={styles.achievementItem}>
                <Text style={styles.achievementText}>{item.badge} {item.title} (레벨 {item.level})</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>그룹 성과 및 보상 페이지</Text>

            {/* 그룹 목표 달성 현황 */}
            <Text style={styles.sectionTitle}>그룹 목표 달성 현황</Text>
            <FlatList
                data={achievements}
                keyExtractor={(item) => item.id}
                renderItem={renderAchievement}
            />

            {/* 보상 시스템 */}
            <Text style={styles.sectionTitle}>보상 시스템</Text>
            <FlatList
                data={rewards}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.rewardItem}>
                        <Text style={styles.rewardTitle}>{item.title}</Text>
                        <Text style={styles.rewardDescription}>{item.description}</Text>
                    </View>
                )}
            />

            {/* 성취 상세 모달 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>{selectedAchievement?.title}</Text>
                    <Text style={styles.modalDescription}>레벨: {selectedAchievement?.level}</Text>
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
    achievementItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    achievementText: {
        fontSize: 16,
    },
    rewardItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    rewardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    rewardDescription: {
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalDescription: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 16,
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

export default GroupPerformanceAndRewardsScreen; 