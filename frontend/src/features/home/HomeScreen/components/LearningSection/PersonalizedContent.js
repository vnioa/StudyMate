// features/home/components/LearningSection/PersonalizedContent.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLearning } from '../../../hooks/useLearning';
import { useNavigation } from '@react-navigation/native';
import ContentCard from '../../../../../components/common/Card';
import styles from './styles';

const PersonalizedContent = () => {
    const { personalizedContent } = useLearning();
    const navigation = useNavigation();

    const handleContentPress = (contentId) => {
        navigation.navigate('ContentDetail', { contentId });
    };

    return (
        <View style={styles.personalizedSection}>
            <View style={styles.header}>
                <Text style={styles.title}>맞춤 학습 콘텐츠</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AllContent')}>
                    <Text style={styles.viewAll}>전체보기</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {personalizedContent.map((content) => (
                    <TouchableOpacity
                        key={content.id}
                        style={styles.contentCard}
                        onPress={() => handleContentPress(content.id)}
                    >
                        <ContentCard
                            title={content.title}
                            description={content.description}
                            thumbnail={content.thumbnail}
                            duration={content.duration}
                            difficulty={content.difficulty}
                            rating={content.rating}
                            progress={content.progress}
                        />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default PersonalizedContent;