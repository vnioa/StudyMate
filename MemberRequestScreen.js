//VB
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MemberRequestScreen = ({ navigation }) => {
    const members = [
        { id: '1', name: '김씨', image: '' },
        { id: '2', name: '박씨', image: '' },
        { id: '3', name: '이씨', image: '' }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
                    <Text style={styles.backButtonTextHeader}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>멤버 관리</Text>
            </View>
            <Text style={styles.sectionTitle}>멤버 가입 요청</Text>
            <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.memberItem}>
                        <Image source={{ uri: item.image }} style={styles.memberImage} />
                        <Text style={styles.memberName}>{item.name}</Text>
                        <View style={styles.buttons}>
                            <TouchableOpacity style={styles.rejectButton}>
                                <Text style={styles.buttonText}>거절</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.acceptButton}>
                                <Text style={styles.buttonText}>승인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    backButtonHeader: {
        position: 'absolute',
        left: 10,
    },
    backButtonTextHeader: {
        fontSize: 30,
        color: '#000',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
        marginLeft: 40,
        marginRight: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    memberImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    memberName: {
        flex: 1,
        fontSize: 16,
    },
    buttons: {
        flexDirection: 'row',
    },
    rejectButton: {
        backgroundColor: '#d3e5ff',
        padding: 10,
        borderRadius: 5,
        marginRight: 5,
    },
    acceptButton: {
        backgroundColor: '#ffd3d3',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default MemberRequestScreen; 