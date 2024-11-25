import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    TextInput,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mentorAPI } from '../../services/api';

const MentoringScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            setLoading(true);
            const response = await mentorAPI.getMentors();
            setMentors(response.data.mentors);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '멘토 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleBecomeMentor = async () => {
        try {
            const response = await mentorAPI.applyMentor();
            if (response.data.success) {
                Alert.alert('성공', '멘토 신청이 완료되었습니다.');
                navigation.navigate('MentorApplication');
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '멘토 신청에 실패했습니다.');
        }
    };

    const handleMentorMatch = async (mentorId) => {
        try {
            const response = await mentorAPI.requestMatch(mentorId);
            if (response.data.success) {
                Alert.alert('성공', '멘토링 매칭 요청이 전송되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '매칭 요청에 실패했습니다.');
        }
    };

    const filteredMentors = mentors.filter(mentor =>
        mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mentor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderMentorItem = ({ item }) => (
        <View style={styles.memberItem}>
            <Image
                source={{ uri: item.profileImage || 'default_profile_image_url' }}
                style={styles.memberImage}
            />
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberRole}>{item.specialty}</Text>
            </View>
            <TouchableOpacity
                style={styles.matchButton}
                onPress={() => handleMentorMatch(item.id)}
            >
                <Text style={styles.matchButtonText}>매칭</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>멘토링</Text>
                <View style={{ width: 24 }} />
            </View>

            <TextInput
                style={styles.searchInput}
                placeholder="멘토 검색..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <View style={styles.buttons}>
                <TouchableOpacity
                    style={styles.findMentorButton}
                    onPress={() => navigation.navigate('MentorSearch')}
                >
                    <Text style={styles.buttonText}>멘토 찾기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.becomeMentorButton}
                    onPress={handleBecomeMentor}
                >
                    <Text style={styles.buttonText}>멘토 되기</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>추천 멘토</Text>
            <FlatList
                data={filteredMentors}
                keyExtractor={(item) => item.id}
                renderItem={renderMentorItem}
                refreshing={loading}
                onRefresh={fetchMentors}
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
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
        flex: 1, // Căn giữa tiêu đề
        textAlign: 'center', // Căn giữa tiêu đề
    },
    searchInput: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    findMentorButton: {
        backgroundColor: '#4A90E2',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginRight: 5,
        alignItems: 'center',
    },
    becomeMentorButton: {
        backgroundColor: '#ddd',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginLeft: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
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
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
    },
    memberRole: {
        fontSize: 14,
        color: '#888',
    },
    matchButton: {
        backgroundColor: '#ffd3d3',
        padding: 10,
        borderRadius: 5,
    },
    matchButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default MentoringScreen;