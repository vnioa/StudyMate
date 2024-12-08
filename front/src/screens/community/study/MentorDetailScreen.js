import React, { useState, useCallback, memo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const BASE_URL = 'http://121.127.165.43:3000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const MentorDetailScreen = memo(({ route, navigation }) => {
    const { mentorId } = route.params;
    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    const checkNetwork = async () => {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            setIsOnline(false);
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }
        setIsOnline(true);
        return true;
    };

    const fetchMentorDetail = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedMentor = await AsyncStorage.getItem(`mentor_${mentorId}`);
            if (cachedMentor) {
                const parsed = JSON.parse(cachedMentor);
                setMentor(parsed);
                setIsOwnProfile(parsed.isOwnProfile);
            }
            return;
        }

        try {
            const response = await api.get(`/api/mentors/${mentorId}`);
            if (response.data.success) {
                setMentor(response.data.mentor);
                setIsOwnProfile(response.data.isOwnProfile);
                await AsyncStorage.setItem(`mentor_${mentorId}`,
                    JSON.stringify(response.data));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '멘토 정보를 불러오는데 실패했습니다',
                [{ text: '확인', onPress: () => navigation.goBack() }]
            );
        } finally {
            setLoading(false);
        }
    }, [mentorId]);

    useEffect(() => {
        fetchMentorDetail();
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected);
        });
        return () => {
            unsubscribe();
            setMentor(null);
        };
    }, [fetchMentorDetail]);

    const handleStartChat = async () => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.post(`/api/mentors/${mentorId}/chat`);
            if (response.data.success) {
                navigation.navigate('Chat', {
                    chatId: response.data.chatId,
                    mentorName: mentor.name
                });
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '채팅 시작에 실패했습니다'
            );
        }
    };

    const handleEditProfile = useCallback(() => {
        if (!isOnline) return;

        navigation.navigate('EditMentorProfile', {
            mentorId,
            currentData: {
                field: mentor.field,
                experience: mentor.experience,
                introduction: mentor.introduction
            }
        });
    }, [navigation, mentorId, mentor, isOnline]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>멘토 프로필</Text>
                {isOwnProfile && (
                    <TouchableOpacity
                        onPress={handleEditProfile}
                        disabled={!isOnline}
                    >
                        <Ionicons
                            name="pencil"
                            size={24}
                            color={isOnline ? theme.colors.primary : theme.colors.textDisabled}
                        />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.profileSection}>
                    {mentor.avatar ? (
                        <Image
                            source={{ uri: mentor.avatar }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons
                                name="person"
                                size={40}
                                color={theme.colors.textSecondary}
                            />
                        </View>
                    )}
                    <Text style={styles.name}>{mentor.name}</Text>
                    <Text style={styles.field}>{mentor.field}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>경력</Text>
                    <Text style={styles.sectionContent}>{mentor.experience}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>자기소개</Text>
                    <Text style={styles.sectionContent}>{mentor.introduction}</Text>
                </View>

                <View style={styles.statsSection}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{mentor.menteeCount}</Text>
                        <Text style={styles.statLabel}>멘티</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{mentor.rating}</Text>
                        <Text style={styles.statLabel}>평점</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{mentor.reviewCount}</Text>
                        <Text style={styles.statLabel}>후기</Text>
                    </View>
                </View>
            </ScrollView>

            {!isOwnProfile && (
                <TouchableOpacity
                    style={[
                        styles.chatButton,
                        !isOnline && styles.buttonDisabled
                    ]}
                    onPress={handleStartChat}
                    disabled={!isOnline}
                >
                    <Text style={[
                        styles.chatButtonText,
                        !isOnline && styles.textDisabled
                    ]}>채팅하기</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    content: {
        flex: 1,
    },
    profileSection: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: theme.spacing.md,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    name: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    field: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
    },
    section: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        ...theme.typography.titleMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    sectionContent: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        lineHeight: 24,
    },
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        ...theme.typography.headlineSmall,
        color: theme.colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    chatButton: {
        margin: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.large,
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    chatButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: theme.colors.disabled,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    }
});

MentorDetailScreen.displayName = 'MentorDetailScreen';

export default MentorDetailScreen;