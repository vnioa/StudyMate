import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Header from '../../components/shared/Header';
import CustomButton from '../../components/shared/CustomButton';
import {API_URL} from "../../config/apiUrl";

const FriendProfileScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { friendId } = route.params;
    const [friend, setFriend] = useState(null);
    const [commonGroups, setCommonGroups] = useState([]);

    useEffect(() => {
        fetchFriendProfile();
        fetchCommonGroups();
    }, []);

    const fetchFriendProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/friends/${friendId}`);
            const data = await response.json();
            setFriend(data);
        } catch (error) {
            console.error('프로필 조회 실패:', error);
        }
    };

    const fetchCommonGroups = async () => {
        try {
            const response = await fetch(`${API_URL}/friends/${friendId}/common-groups`);
            const data = await response.json();
            setCommonGroups(data);
        } catch (error) {
            console.error('공통 그룹 조회 실패:', error);
        }
    };

    const handleStartChat = () => {
        navigation.navigate('ChatRoom', {
            type: 'direct',
            participantId: friendId
        });
    };

    const handleBlockUser = () => {
        Alert.alert(
            "친구 차단",
            "정말 차단하시겠습니까?",
            [
                {
                    text: "취소",
                    style: "cancel"
                },
                {
                    text: "차단",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await fetch(`${API_URL}/friends/block`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ blockedUserId: friendId })
                            });
                            navigation.goBack();
                        } catch (error) {
                            console.error('친구 차단 실패:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteFriend = () => {
        Alert.alert(
            "친구 삭제",
            "정말 삭제하시겠습니까?",
            [
                {
                    text: "취소",
                    style: "cancel"
                },
                {
                    text: "삭제",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await fetch(`${API_URL}/friends/${friendId}`, {
                                method: 'DELETE'
                            });
                            navigation.goBack();
                        } catch (error) {
                            console.error('친구 삭제 실패:', error);
                        }
                    }
                }
            ]
        );
    };

    if (!friend) return null;

    return (
        <View style={styles.container}>
            <Header
                title="프로필"
                showBack={true}
            />
            <View style={styles.profileSection}>
                <Image
                    source={friend.profileImage ? { uri: friend.profileImage } : require('../../../assets/default-profile.png')}
                    style={styles.profileImage}
                />
                <Text style={styles.name}>{friend.name}</Text>
                <Text style={styles.statusMessage}>{friend.statusMessage}</Text>
            </View>

            <View style={styles.actionButtons}>
                <CustomButton
                    title="1:1 채팅"
                    onPress={handleStartChat}
                    type="primary"
                />
            </View>

            <View style={styles.commonGroupsSection}>
                <Text style={styles.sectionTitle}>함께 있는 그룹</Text>
                {commonGroups.map(group => (
                    <Text key={group.id} style={styles.groupName}>{group.name}</Text>
                ))}
            </View>

            <View style={styles.bottomButtons}>
                <CustomButton
                    title="차단하기"
                    onPress={handleBlockUser}
                    type="secondary"
                    buttonStyle={styles.blockButton}
                />
                <CustomButton
                    title="친구 삭제"
                    onPress={handleDeleteFriend}
                    type="danger"
                    buttonStyle={styles.deleteButton}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    profileSection: {
        alignItems: 'center',
        padding: 20
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16
    },
    name: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 8
    },
    statusMessage: {
        fontSize: 16,
        color: '#666'
    },
    actionButtons: {
        padding: 16
    },
    commonGroupsSection: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12
    },
    groupName: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8
    },
    bottomButtons: {
        padding: 16,
        marginTop: 'auto'
    },
    blockButton: {
        marginBottom: 8
    },
    deleteButton: {
        marginBottom: 16
    }
});

export default FriendProfileScreen;