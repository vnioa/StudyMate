// src/screens/friends/AddFriendScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { theme } from '../../utils/styles';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

export default function AddFriendScreen() {
    const navigation = useNavigation();

    // 상태 관리
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [showScanner, setShowScanner] = useState(false);

    // QR 스캐너 권한 체크
    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    // 친구 추천 목록 로드
    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        try {
            const response = await api.friend.getRecommendations();
            setRecommendations(response);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        }
    };

    // 사용자 검색
    const handleSearch = async (text) => {
        setSearchText(text);
        if (!text.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        setIsLoading(true);

        try {
            const response = await api.friend.searchUsers(text);
            setSearchResults(response);
        } catch (error) {
            Alert.alert('오류', '사용자 검색에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 친구 요청 보내기
    const handleSendRequest = async (userId) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await api.friend.sendRequest(userId);
            Alert.alert('성공', '친구 요청을 보냈습니다.');

            // 검색 결과 및 추천 목록 업데이트
            setSearchResults(prev =>
                prev.map(user =>
                    user.id === userId
                        ? { ...user, requestSent: true }
                        : user
                )
            );
            setRecommendations(prev =>
                prev.map(user =>
                    user.id === userId
                        ? { ...user, requestSent: true }
                        : user
                )
            );

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '친구 요청 전송에 실패했습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // QR 코드 스캔 처리
    const handleBarCodeScanned = async ({ data }) => {
        try {
            const userId = JSON.parse(data).userId;
            await handleSendRequest(userId);
            setShowScanner(false);
        } catch (error) {
            Alert.alert('오류', '잘못된 QR 코드입니다.');
            setShowScanner(false);
        }
    };

    // 사용자 아이템 렌더링
    const renderUserItem = ({ item }) => (
        <View style={styles.userItem}>
            <Avatar
                source={{ uri: item.avatar }}
                size="medium"
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                {item.statusMessage && (
                    <Text style={styles.statusMessage} numberOfLines={1}>
                        {item.statusMessage}
                    </Text>
                )}
            </View>
            <TouchableOpacity
                style={[
                    styles.requestButton,
                    item.requestSent && styles.requestButtonSent
                ]}
                onPress={() => handleSendRequest(item.id)}
                disabled={item.requestSent}
            >
                <Text style={[
                    styles.requestButtonText,
                    item.requestSent && styles.requestButtonTextSent
                ]}>
                    {item.requestSent ? '요청됨' : '친구 추가'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    if (showScanner) {
        return (
            <View style={styles.container}>
                <BarCodeScanner
                    onBarCodeScanned={handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowScanner(false)}
                >
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 검색바 */}
            <View style={styles.searchContainer}>
                <Ionicons
                    name="search"
                    size={20}
                    color={theme.colors.text.secondary}
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder="이름, 이메일 또는 전화번호로 검색"
                    value={searchText}
                    onChangeText={handleSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {isSearching && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            setSearchText('');
                            setSearchResults([]);
                            setIsSearching(false);
                        }}
                    >
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color={theme.colors.text.secondary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* QR 코드 스캔 버튼 */}
            <TouchableOpacity
                style={styles.qrButton}
                onPress={() => {
                    if (hasPermission) {
                        setShowScanner(true);
                    } else {
                        Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
                    }
                }}
            >
                <Ionicons name="qr-code" size={24} color={theme.colors.primary.main} />
                <Text style={styles.qrButtonText}>QR 코드로 친구 추가</Text>
            </TouchableOpacity>

            {/* 검색 결과 또는 추천 친구 목록 */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary.main} />
                </View>
            ) : (
                <FlatList
                    data={isSearching ? searchResults : recommendations}
                    renderItem={renderUserItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        !isSearching && (
                            <Text style={styles.sectionTitle}>추천 친구</Text>
                        )
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name={isSearching ? "search" : "people-outline"}
                                size={48}
                                color={theme.colors.text.secondary}
                            />
                            <Text style={styles.emptyText}>
                                {isSearching
                                    ? '검색 결과가 없습니다'
                                    : '추천 친구가 없습니다'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
        padding: 0,
    },
    clearButton: {
        padding: theme.spacing.xs,
    },
    qrButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    qrButtonText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.size.body1,
        color: theme.colors.primary.main,
        fontFamily: theme.typography.fontFamily.medium,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        padding: theme.spacing.md,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    avatar: {
        marginRight: theme.spacing.md,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    statusMessage: {
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
    },
    requestButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.primary.main,
    },
    requestButtonSent: {
        backgroundColor: theme.colors.grey[200],
    },
    requestButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    requestButtonTextSent: {
        color: theme.colors.text.secondary,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl * 2,
    },
    emptyText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        right: 20,
        padding: theme.spacing.sm,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
    },
    listContent: {
        flexGrow: 1,
    }
});