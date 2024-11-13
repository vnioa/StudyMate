import React from 'react';
import { Modal, View, Text, Button, StyleSheet } from 'react-native';

const FilePreviewModal = ({ file, isVisible, onClose, onSend }) => (
    <Modal visible={isVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
            <Text>{file.name}</Text>
            <Button title="전송" onPress={() => onSend(file)} />
            <Button title="닫기" onPress={onClose} />
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
});

export default FilePreviewModal;
