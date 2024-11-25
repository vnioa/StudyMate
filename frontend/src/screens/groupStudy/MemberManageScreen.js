import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupAPI } from '../../services/api';

const MemberManageScreen = ({ navigation, route }) => {
    const [groupInfo, setGroupInfo] = useState(null);
    const { groupId } = route.params;

    useEffect(() => {
        fetchGroupInfo();
    }, [groupId]);

    const fetchGroupInfo = async () => {
        try {
            const response = await groupAPI.getGroupDetails(groupId);
            setGroupInfo(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '그룹 정보를 불러오는데 실패했습니다.');
        }
    };

    const options = [
        {
            title: '초기 멤버 초대',
            screen: 'MemberRole',
            icon: 'person-add-outline',
            onPress: () => navigation.navigate('MemberRole', { groupId })
        },
        {
            title: '멤버 가입 요청',
            screen: 'MemberRequest',
            icon: 'people-outline',
            badge: groupInfo?.pendingRequests,
            onPress: () => navigation.navigate('MemberRequest', { groupId })
        },
        {
            title: '멤버 역할 부여 및 권한 관리',
            screen: 'MemberRole',
            icon: 'settings-outline',
            onPress: () => navigation.navigate('MemberRole', { groupId })
        },
        {
            title: '멤버 활동 내역 조회',
            screen: 'MemberActivity',
            icon: 'analytics-outline',
            onPress: () => navigation.navigate('MemberActivity', { groupId })
        },
        {
            title: '멘토링',
            screen: 'Mentoring',
            icon: 'school-outline',
            onPress: () => navigation.navigate('Mentoring', { groupId })
        }
    ];

    const renderOptionItem = (option, index) => (
        <TouchableOpacity
            key={index}
            style={styles.optionItem}
            onPress={option.onPress}
        >
            <View style={styles.optionLeft}>
                <Ionicons name={option.icon} size={24} color="#666" />
                <Text style={styles.optionText}>{option.title}</Text>
            </View>
            <View style={styles.optionRight}>
                {option.badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{option.badge}</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="gray" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconButton}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>멤버 관리</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.content}>
                {options.map(renderOptionItem)}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    iconButton: {
        padding: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    content: {
        flex: 1,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        marginLeft: 15,
    },
    optionRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 6,
    },
});

export default MemberManageScreen;