// src/screens/profile/PortfolioScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    RefreshControl,
    Animated,
    Share,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 250;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function PortfolioScreen() {
    const navigation = useNavigation();
    const scrollY = new Animated.Value(0);

    // 상태 관리
    const [portfolio, setPortfolio] = useState({
        projects: [],
        skills: [],
        education: [],
        certifications: [],
        experience: [],
        awards: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('projects');

    // 헤더 애니메이션 값
    const headerHeight = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        extrapolate: 'clamp'
    });

    const headerTitleOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp'
    });

    const headerImageOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp'
    });

    // 데이터 로드
    useEffect(() => {
        loadPortfolio();
    }, []);

    const loadPortfolio = async () => {
        try {
            setIsLoading(true);
            const response = await api.profile.getPortfolio();
            setPortfolio(response);
        } catch (error) {
            console.error('Failed to load portfolio:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 포트폴리오 공유
    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: '내 포트폴리오를 확인해보세요!',
                url: `studymate://portfolio/${portfolio.id}`
            });

            if (result.action === Share.sharedAction) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    // 프로젝트 상세보기
    const handleProjectPress = (project) => {
        navigation.navigate('ProjectDetail', { projectId: project.id });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadPortfolio();
                        }}
                        colors={[theme.colors.primary.main]}
                    />
                }
            >
                {/* 카테고리 선택 */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryContainer}
                    contentContainerStyle={styles.categoryContent}
                >
                    {[
                        { id: 'projects', label: '프로젝트' },
                        { id: 'skills', label: '기술 스택' },
                        { id: 'education', label: '학력' },
                        { id: 'certifications', label: '자격증' },
                        { id: 'experience', label: '경력' },
                        { id: 'awards', label: '수상 내역' }
                    ].map(category => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryButton,
                                selectedCategory === category.id && styles.categoryButtonActive
                            ]}
                            onPress={() => {
                                setSelectedCategory(category.id);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <Text style={[
                                styles.categoryButtonText,
                                selectedCategory === category.id && styles.categoryButtonTextActive
                            ]}>
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* 프로젝트 목록 */}
                {selectedCategory === 'projects' && (
                    <View style={styles.section}>
                        {portfolio.projects.map((project, index) => (
                            <TouchableOpacity
                                key={project.id}
                                style={styles.projectItem}
                                onPress={() => handleProjectPress(project)}
                            >
                                <Image
                                    source={{ uri: project.thumbnail }}
                                    style={styles.projectImage}
                                />
                                <View style={styles.projectInfo}>
                                    <Text style={styles.projectTitle}>{project.title}</Text>
                                    <Text style={styles.projectDescription} numberOfLines={2}>
                                        {project.description}
                                    </Text>
                                    <View style={styles.projectMeta}>
                                        <Text style={styles.projectDate}>
                                            {date.format(project.startDate, 'YYYY.MM')} - {
                                            project.endDate ? date.format(project.endDate, 'YYYY.MM') : '진행중'
                                        }
                                        </Text>
                                        <View style={styles.projectTags}>
                                            {project.tags.map((tag, tagIndex) => (
                                                <View key={tagIndex} style={styles.tag}>
                                                    <Text style={styles.tagText}>{tag}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* 기술 스택 */}
                {selectedCategory === 'skills' && (
                    <View style={styles.section}>
                        {Object.entries(portfolio.skills).map(([category, skills]) => (
                            <View key={category} style={styles.skillCategory}>
                                <Text style={styles.skillCategoryTitle}>{category}</Text>
                                <View style={styles.skillGrid}>
                                    {skills.map((skill, index) => (
                                        <View key={index} style={styles.skillItem}>
                                            <Image
                                                source={{ uri: skill.icon }}
                                                style={styles.skillIcon}
                                            />
                                            <Text style={styles.skillName}>{skill.name}</Text>
                                            <View style={[
                                                styles.skillLevel,
                                                { width: `${skill.level * 20}%` }
                                            ]} />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* 학력 */}
                {selectedCategory === 'education' && (
                    <View style={styles.section}>
                        {portfolio.education.map((edu, index) => (
                            <View key={index} style={styles.educationItem}>
                                <View style={styles.educationHeader}>
                                    <Text style={styles.schoolName}>{edu.school}</Text>
                                    <Text style={styles.educationPeriod}>
                                        {date.format(edu.startDate, 'YYYY.MM')} - {
                                        edu.endDate ? date.format(edu.endDate, 'YYYY.MM') : '재학중'
                                    }
                                    </Text>
                                </View>
                                <Text style={styles.major}>{edu.major}</Text>
                                {edu.gpa && (
                                    <Text style={styles.gpa}>
                                        평점: {edu.gpa} / {edu.maxGpa}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* 자격증 */}
                {selectedCategory === 'certifications' && (
                    <View style={styles.section}>
                        {portfolio.certifications.map((cert, index) => (
                            <View key={index} style={styles.certificationItem}>
                                <Text style={styles.certificationName}>{cert.name}</Text>
                                <Text style={styles.certificationIssuer}>{cert.issuer}</Text>
                                <Text style={styles.certificationDate}>
                                    취득일: {date.format(cert.date, 'YYYY.MM.DD')}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* 경력 */}
                {selectedCategory === 'experience' && (
                    <View style={styles.section}>
                        {portfolio.experience.map((exp, index) => (
                            <View key={index} style={styles.experienceItem}>
                                <View style={styles.experienceHeader}>
                                    <Text style={styles.companyName}>{exp.company}</Text>
                                    <Text style={styles.experiencePeriod}>
                                        {date.format(exp.startDate, 'YYYY.MM')} - {
                                        exp.endDate ? date.format(exp.endDate, 'YYYY.MM') : '재직중'
                                    }
                                    </Text>
                                </View>
                                <Text style={styles.position}>{exp.position}</Text>
                                <View style={styles.responsibilities}>
                                    {exp.responsibilities.map((item, itemIndex) => (
                                        <Text key={itemIndex} style={styles.responsibilityText}>
                                            • {item}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* 수상 내역 */}
                {selectedCategory === 'awards' && (
                    <View style={styles.section}>
                        {portfolio.awards.map((award, index) => (
                            <View key={index} style={styles.awardItem}>
                                <Text style={styles.awardName}>{award.name}</Text>
                                <Text style={styles.awardIssuer}>{award.issuer}</Text>
                                <Text style={styles.awardDate}>
                                    {date.format(award.date, 'YYYY.MM.DD')}
                                </Text>
                                <Text style={styles.awardDescription}>{award.description}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Animated.ScrollView>

            {/* 헤더 이미지 */}
            <Animated.Image
                source={{ uri: portfolio.coverImage }}
                style={[
                    styles.headerImage,
                    {
                        height: headerHeight,
                        opacity: headerImageOpacity
                    }
                ]}
            />

            {/* 헤더 버튼 */}
            <View style={styles.headerButtons}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleShare}
                >
                    <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingTop: HEADER_MAX_HEIGHT,
    },
    headerImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.grey[200],
    },
    headerButtons: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 44 : 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryContainer: {
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    categoryContent: {
        padding: theme.spacing.md,
    },
    categoryButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.background.secondary,
        marginRight: theme.spacing.sm,
    },
    categoryButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    categoryButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    categoryButtonTextActive: {
        color: theme.colors.text.contrast,
    },
    section: {
        padding: theme.spacing.md,
    },
    projectItem: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
    },
    projectImage: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.grey[200],
    },
    projectInfo: {
        padding: theme.spacing.md,
    },
    projectTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    projectDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    projectMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    projectDate: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    projectTags: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
    },
    tag: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        backgroundColor: theme.colors.primary.main + '20',
        borderRadius: 12,
    },
    tagText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    skillCategory: {
        marginBottom: theme.spacing.lg,
    },
    skillCategoryTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    skillGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    skillItem: {
        width: (width - theme.spacing.md * 4) / 3,
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
    },
    skillIcon: {
        width: 40,
        height: 40,
        marginBottom: theme.spacing.sm,
    },
    skillName: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
    },
    skillLevel: {
        height: 4,
        backgroundColor: theme.colors.primary.main,
        borderRadius: 2,
    },
    educationItem: {
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.md,
    },
    educationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    schoolName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    educationPeriod: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    major: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    gpa: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    certificationItem: {
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.md,
    },
    certificationName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    certificationIssuer: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    certificationDate: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    experienceItem: {
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.md,
    },
    experienceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    companyName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    experiencePeriod: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    position: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    responsibilities: {
        paddingLeft: theme.spacing.sm,
    },
    responsibilityText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    awardItem: {
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.md,
    },
    awardName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    awardIssuer: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    awardDate: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    awardDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    }
});