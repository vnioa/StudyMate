// features/home/components/StudyGroupSection/CommunityFeed.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useStudyGroup } from '../../../hooks/useStudyGroup';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles';

const CommunityFeed = () => {
    const { communityPosts } = useStudyGroup();
    const navigation = useNavigation();

    const handlePostPress = (postId) => {
        navigation.navigate('PostDetail', { postId });
    };

    const renderPostItem = ({ item }) => (
        <TouchableOpacity
            style={styles.postItem}
            onPress={() => handlePostPress(item.id)}
        >
            <View style={styles.postHeader}>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postTime}>{item.createdAt}</Text>
            </View>
            <Text style={styles.postContent} numberOfLines={2}>
                {item.content}
            </Text>
            <View style={styles.postFooter}>
                <View style={styles.postStats}>
                    <Icon name="thumb-up" size={16} color="#666666" />
                    <Text style={styles.statText}>{item.likes}</Text>
                    <Icon name="comment" size={16} color="#666666" />
                    <Text style={styles.statText}>{item.comments}</Text>
                </View>
                <Text style={styles.groupName}>{item.groupName}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.feedSection}>
            <View style={styles.header}>
                <Text style={styles.title}>커뮤니티 피드</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Community')}>
                    <Text style={styles.viewAll}>전체보기</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={communityPosts}
                renderItem={renderPostItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.feedContent}
            />
        </View>
    );
};

export default CommunityFeed;