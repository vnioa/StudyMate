// 3.파일 공유 페이지 ok
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';

const FileShareScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [files] = useState([
        { id: '1', name: 'Document1.pdf', type: 'PDF' },
        { id: '2', name: 'Image1.png', type: 'Image' },
        { id: '3', name: 'Video1.mp4', type: 'Video' },
        { id: '4', name: 'hello.mp4', type: 'Video' },
        // Thêm tệp mẫu ở đây
    ]);
    const [filteredFiles, setFilteredFiles] = useState(files);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const filterFiles = (type) => {
        if (type === 'All') {
            setFilteredFiles(files);
        } else {
            setFilteredFiles(files.filter(file => file.type === type));
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        setFilteredFiles(files.filter(file => file.name.includes(query)));
    };

    const downloadFile = (file) => {
        alert(`${file.name} 다운로드 되었습니다.`);
    };

    const deleteFile = (file) => {
        alert(`${file.name} 삭제되었습니다.`);
    };

    const previewFile = (file) => {
        setSelectedFile(file);
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>파일 및 미디어 공유 페이지</Text>
            <TextInput
                style={styles.searchInput}
                placeholder="파일 검색"
                value={searchQuery}
                onChangeText={handleSearch}
            />
            <View style={styles.filterContainer}>
                <TouchableOpacity onPress={() => filterFiles('All')} style={styles.filterButton}>
                    <Text style={styles.filterText}>모두</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => filterFiles('PDF')} style={styles.filterButton}>
                    <Text style={styles.filterText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => filterFiles('Image')} style={styles.filterButton}>
                    <Text style={styles.filterText}>이미지</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => filterFiles('Video')} style={styles.filterButton}>
                    <Text style={styles.filterText}>비디오</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={filteredFiles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.fileItem}>
                        <Text style={styles.fileName}>{item.name}</Text>
                        <View style={styles.fileActions}>
                            <TouchableOpacity onPress={() => downloadFile(item)}>
                                <Text style={styles.actionText}>다운로드</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteFile(item)}>
                                <Text style={styles.actionText}>삭제</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => previewFile(item)}>
                                <Text style={styles.actionText}>미리보기</Text>
                            </TouchableOpacity>
                        </View>
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
                    <Text style={styles.modalText}>미리보기: {selectedFile?.name}</Text>
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
    searchInput: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    filterButton: {
        padding: 10,
        backgroundColor: '#4A90E2',
        borderRadius: 5,
    },
    filterText: {
        color: '#fff',
    },
    fileItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    fileName: {
        fontSize: 16,
    },
    fileActions: {
        flexDirection: 'row',
    },
    actionText: {
        marginLeft: 10,
        color: '#4A90E2',
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
    },
});

export default FileShareScreen; 