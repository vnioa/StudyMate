// features/home/components/LearningSection/PopularContent.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useLearning } from '../../hooks/useLearning';
import { useNavigation } from '@react-navigation/native';
import ContentCard from '../../../../components/common/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles';

const PopularContent = () => {
    const { popularContent } = useLearning();
    const navigation = useNavigation();

    const handleContentPress = (contentId) => {
        navigation.navigate('ContentDetail', { contentId });
    };

    const renderContentItem = ({ item, index }) => (
        <TouchableOpacity
            style={styles.popularItem}
            onPress={() => handleContentPress(item.id)}
        >
            <View style={styles.rankingBadge}>
                <Text style={styles.rankingText}>{index + 1}</Text>
            </View>
            <ContentCard
                title={item.title}
                description={item.description}
                thumbnail={item.thumbnail}
                duration={item.duration}
                difficulty={item.difficulty}
                rating={item.rating}
                views={item.views}
                trending={item.trending}
            />
            {item.trending && (
                <Icon
                    name="trending-up"
                    size={20}
                    color="#FF4B4B"
                    style={styles.trendingIcon}
                />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.popularSection}>
            <View style={styles.header}>
                <Text style={styles.title}>인기 학습 콘텐츠</Text>
                <TouchableOpacity onPress={() => navigation.navigate('PopularContent')}>
                    <Text style={styles.viewAll}>전체보기</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={popularContent}
                renderItem={renderContentItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

export default PopularContent;