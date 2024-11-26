// HomeScreen.js
import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Animated,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CircularProgress } from 'react-native-circular-progress';

const HomeScreen = ({ navigation }) => {
    const scrollY = useRef(new Animated.Value(0)).current;
    const [todayStudyTime, setTodayStudyTime] = useState(0);
    const [streakDays, setStreakDays] = useState(0);

    // 상단 바 애니메이션
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [80, 60],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            {/* 상단 바 */}
            <Animated.View style={[styles.header, { height: headerHeight }]}>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('MyPage')}
                    accessibilityLabel="마이페이지로 이동"
                >
                    <Image
                        source={require('../../../assets/default-profile.png')}
                        style={styles.profileImage}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.logoContainer}
                    onPress={() => navigation.navigate('Home')}
                    accessibilityLabel="홈 화면으로 이동"
                >
                    <Image
                        source={require('../../../assets/home.png')}
                        style={styles.logo}
                    />
                </TouchableOpacity>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Ionicons name="settings-outline" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* 메인 콘텐츠 */}
            <ScrollView
                style={styles.scrollView}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* 오늘의 학습 요약 카드 */}
                <View style={styles.summaryCard}>
                    <CircularProgress
                        size={120}
                        width={15}
                        fill={todayStudyTime / 360 * 100}
                        tintColor="#4A90E2"
                        backgroundColor="#eee"
                    >
                        {() => (
                            <View style={styles.progressContent}>
                                <Text style={styles.timeText}>{todayStudyTime}분</Text>
                                <Text style={styles.streakText}>🔥 {streakDays}일째</Text>
                            </View>
                        )}
                    </CircularProgress>
                </View>

                {/* 빠른 액세스 버튼 */}
                <ScrollView
                    horizontal
                    style={styles.quickAccessContainer}
                    showsHorizontalScrollIndicator={false}
                >
                    {['개인학습', '그룹학습', '채팅', '통계'].map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.quickAccessButton}
                        >
                            <Ionicons name="book-outline" size={30} color="#4A90E2" />
                            <Text style={styles.quickAccessText}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* 최근 활동 */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>최근 활동</Text>
                    {/* 최근 활동 리스트 구현 */}
                </View>

                {/* 추천 학습 콘텐츠 */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>추천 학습</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.recommendContainer}
                    >
                        {/* 추천 콘텐츠 카드 구현 */}
                    </ScrollView>
                </View>
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
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    logoContainer: {
        width: 120,
        height: 30,
    },
    logo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 8,
        marginLeft: 8,
    },
    scrollView: {
        flex: 1,
    },
    summaryCard: {
        padding: 20,
        alignItems: 'center',
    },
    progressContent: {
        alignItems: 'center',
    },
    timeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    streakText: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    quickAccessContainer: {
        padding: 16,
    },
    quickAccessButton: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    quickAccessText: {
        marginTop: 8,
        fontSize: 12,
        color: '#333',
    },
    sectionContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    recommendContainer: {
        marginTop: 8,
    },
});

export default HomeScreen;