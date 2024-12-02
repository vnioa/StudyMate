// 5.학습 자료 관리 페이지

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';

const StudyMaterialManagementScreen = () => {
    const [materials, setMaterials] = useState([]);
    const [materialName, setMaterialName] = useState('');
    const [tags, setTags] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    const addMaterial = () => {
        if (materialName && tags) {
            setMaterials([...materials, { id: Date.now().toString(), name: materialName, tags: tags.split(',') }]);
            setMaterialName('');
            setTags('');
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const filteredMaterials = materials.filter(material =>
        material.name.includes(searchQuery) || material.tags.some(tag => tag.includes(searchQuery))
    );

    const viewMaterial = (material) => {
        setSelectedMaterial(material);
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>학습 자료 관리 페이지</Text>
            <TextInput
                style={styles.input}
                placeholder="자료 이름 입력"
                value={materialName}
                onChangeText={setMaterialName}
            />
            <TextInput
                style={styles.input}
                placeholder="태그 입력 (쉼표로 구분)"
                value={tags}
                onChangeText={setTags}
            />
            <TouchableOpacity style={styles.addButton} onPress={addMaterial}>
                <Text style={styles.buttonText}>자료 업로드</Text>
            </TouchableOpacity>
            <TextInput
                style={styles.searchInput}
                placeholder="자료 검색"
                value={searchQuery}
                onChangeText={handleSearch}
            />
            <FlatList
                data={filteredMaterials}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.materialItem} onPress={() => viewMaterial(item)}>
                        <Text style={styles.materialName}>{item.name}</Text>
                        <Text style={styles.materialTags}>{item.tags.join(', ')}</Text>
                    </TouchableOpacity>
                )}
            />
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>자료: {selectedMaterial?.name}</Text>
                    <Text style={styles.modalText}>태그: {selectedMaterial?.tags.join(', ')}</Text>
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
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    searchInput: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 20,
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
    materialItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    materialName: {
        fontSize: 16,
    },
    materialTags: {
        fontSize: 14,
        color: '#888',
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
});

export default StudyMaterialManagementScreen; 