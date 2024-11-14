// screens/FileMediaManagerStyles.js

import { StyleSheet } from 'react-native';

const FileMediaManagerStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    fileList: {
        marginTop: 10,
    },
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#ffffff',
        marginVertical: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        borderColor: '#e1e1e1',
        borderWidth: 1,
    },
    image: {
        width: 50,
        height: 50,
        marginRight: 10,
    },
    fileName: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    fileSize: {
        fontSize: 12,
        color: '#888',
    },
    deleteButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: '#e74c3c',
        borderRadius: 5,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 14,
    },
});

export default FileMediaManagerStyles;
