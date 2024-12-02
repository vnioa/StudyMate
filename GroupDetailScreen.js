// src/screens/group/GroupDetailScreen.js
//VB 그룹 상세 화면 
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GroupDetailScreen = ({ navigation }) => {
    const [isPublic, setIsPublic] = React.useState(false);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>그룹 상세</Text>
                <TouchableOpacity onPress={() => navigation.navigate('GroupSetting')} style={styles.iconButton}>
                    <Ionicons name="settings-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <View style={styles.groupInfo}>
                <Image
                    //source={require('')} // Thay bằng URL hình ảnh của bạn
                    style={styles.groupImage}
                />
                <Text style={styles.groupName}>선문대학교</Text>
                <Text style={styles.groupDetails}>UNI</Text>
                <Text style={styles.groupMembers}>22.6K members</Text>
            </View>
            <View style={styles.publicMode}>
                <Text style={styles.publicModeText}>공개 모드</Text>
                <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                />
            </View>
            <View style={styles.membersSection}>
                <TouchableOpacity onPress={() => navigation.navigate('MemberManage')} style={styles.memberButton}>
                    <Text style={styles.memberButtonText}>멤버 관리</Text>
                </TouchableOpacity>
                {['김씨', '박씨', '이씨'].map((name, index) => (
                    <TouchableOpacity key={index} style={styles.memberItem}>
                        <Image
                            source={{ uri: '' }} // Thay bằng URL hình ảnh của bạn
                            style={styles.memberImage}
                        />
                        <Text style={styles.memberName}>{name}</Text>
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.feedSection}>
                <Text style={styles.sectionTitle}>그룹 피드</Text>
                <View style={styles.feedItem}>
                    <Image
                        source={{ uri: '' }} // Thay bằng URL hình ảnh của bạn
                        style={styles.feedImage}
                    />
                    <Text style={styles.feedText}>선문대학교 가을</Text>
                    <View style={styles.feedActions}>
                        <Ionicons name="thumbs-up-outline" size={20} color="gray" />
                        <Text style={styles.actionText}>48</Text>
                        <Ionicons name="chatbubble-outline" size={20} color="gray" />
                        <Text style={styles.actionText}>43</Text>
                        <Ionicons name="share-outline" size={20} color="gray" />
                        <Text style={styles.actionText}>12</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
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
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    publicMode: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    publicModeText: {
        fontSize: 18,
    },
    groupInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    groupImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    groupName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    groupDetails: {
        fontSize: 16,
        color: '#888',
    },
    groupMembers: {
        fontSize: 16,
        color: '#888',
    },
    membersSection: {
        marginBottom: 20,
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
    feedSection: {
        marginBottom: 20,
    },
    feedItem: {
        marginBottom: 20,
    },
    feedImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
    },
    feedText: {
        fontSize: 16,
        marginBottom: 10,
    },
    feedActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        marginLeft: 5,
        marginRight: 15,
        fontSize: 16,
    },
    iconButton: {
        padding: 10,
    },
    memberButton: {
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        alignItems: 'center',
        marginVertical: 10,
    },
    memberButtonText: {
        fontSize: 16,
        color: '#333',
    },
});

export default GroupDetailScreen;