// components/common/Card/index.js
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PropTypes from 'prop-types';
import ProgressBar from '../ProgressBar';
import styles from './styles';

const Card = ({
                  title,
                  description,
                  thumbnail,
                  duration,
                  difficulty,
                  rating,
                  progress,
                  views,
                  trending,
                  onPress,
                  style,
                  testID,
                  variant = 'default'
              }) => {
    const renderThumbnail = () => {
        if (!thumbnail) return null;

        return (
            <View style={styles.thumbnailContainer}>
                <Image
                    source={typeof thumbnail === 'string' ? { uri: thumbnail } : thumbnail}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
                {duration && (
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{duration}</Text>
                    </View>
                )}
                {trending && (
                    <View style={styles.trendingBadge}>
                        <Icon name="trending-up" size={16} color="#FFFFFF" />
                        <Text style={styles.trendingText}>인기</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderMetaInfo = () => (
        <View style={styles.metaContainer}>
            {difficulty && (
                <View style={styles.metaItem}>
                    <Icon name="signal" size={16} color="#666666" />
                    <Text style={styles.metaText}>{difficulty}</Text>
                </View>
            )}
            {rating && (
                <View style={styles.metaItem}>
                    <Icon name="star" size={16} color="#FFD700" />
                    <Text style={styles.metaText}>{rating}</Text>
                </View>
            )}
            {views && (
                <View style={styles.metaItem}>
                    <Icon name="eye" size={16} color="#666666" />
                    <Text style={styles.metaText}>{views}</Text>
                </View>
            )}
        </View>
    );

    const renderProgress = () => {
        if (typeof progress !== 'number') return null;

        return (
            <View style={styles.progressContainer}>
                <ProgressBar
                    progress={progress}
                    height={4}
                    backgroundColor="#E5E5EA"
                    progressColor="#007AFF"
                />
                <Text style={styles.progressText}>{progress}% 완료</Text>
            </View>
        );
    };

    const cardStyles = [
        styles.container,
        styles[variant],
        style
    ];

    const content = (
        <>
            {renderThumbnail()}
            <View style={styles.contentContainer}>
                <Text
                    style={styles.title}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {title}
                </Text>
                {description && (
                    <Text
                        style={styles.description}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                    >
                        {description}
                    </Text>
                )}
                {renderMetaInfo()}
                {renderProgress()}
            </View>
        </>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                style={cardStyles}
                onPress={onPress}
                activeOpacity={0.7}
                testID={testID}
            >
                {content}
            </TouchableOpacity>
        );
    }

    return (
        <View style={cardStyles} testID={testID}>
            {content}
        </View>
    );
};

Card.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    thumbnail: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    duration: PropTypes.string,
    difficulty: PropTypes.string,
    rating: PropTypes.number,
    progress: PropTypes.number,
    views: PropTypes.number,
    trending: PropTypes.bool,
    onPress: PropTypes.func,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    testID: PropTypes.string,
    variant: PropTypes.oneOf(['default', 'compact', 'featured'])
};

export default React.memo(Card);