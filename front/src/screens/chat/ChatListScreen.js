import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Animated,
    StyleSheet,
    TouchableOpacity,
    SectionList,
    Platform,
    RefreshControl,
    Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { SafeAreaView } from "react-native";
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import api from '../../services/api';
import { Avatar } from '../../components/UI';
import PropTypes from "prop-types";

export default function ChatListScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    // Refs
    const scrollY = useRef(new Animated.Value(0)).current;
    const swipeableRefs = useRef({});
    const fabAnim = useRef(new Animated.Value(1)).current;

    // 상태 관리
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sections, setSections] = useState([
        { title: '고정된 채팅', data: [] },
        { title: '그룹 채팅', data: [] },
        { title: '개인 채팅', data: [] }
    ]);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());

    // 데이터 로딩
    const loadChatRooms = async (shouldRefresh = false) => {
        try {
            if (!shouldRefresh) setIsLoading(true);
            const response = await api.chat.getRooms();

            const pinnedRooms = response.filter(room => room.isPinned);
            const groupRooms = response.filter(room => !room.isPinned && room.isGroup);
            const personalRooms = response.filter(room => !room.isPinned && !room.isGroup);

            setSections([
                { title: '고정된 채팅', data: pinnedRooms },
                { title: '그룹 채팅', data: groupRooms },
                { title: '개인 채팅', data: personalRooms }
            ]);
        } catch (error) {
            console.error('Failed to load chat rooms:', error);
            Alert.alert('오류', '채팅방 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            if (shouldRefresh) setRefreshing(false);
        }
    };

    // 초기 로딩
    useEffect(() => {
        let mounted = true;

        const initializeChat = async () => {
            try {
                if (isFocused && mounted) {
                    await loadChatRooms();
                }
            } catch (error) {
                console.error('Failed to initialize chat:', error);
            }
        };

        initializeChat();

        return () => {
            mounted = false;
        };
    }, [isFocused]);

    // 채팅방 선택 처리
    const handleSelectRoom = async (roomId) => {
        try {
            if (isSelectMode) {
                const newSelected = new Set(selectedItems);
                if (newSelected.has(roomId)) {
                    newSelected.delete(roomId);
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else {
                    newSelected.add(roomId);
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                setSelectedItems(newSelected);
            } else {
                navigation.navigate('ChatRoom', { roomId });
            }
        } catch (error) {
            console.warn('Error handling room selection:', error);
        }
    };

    // 채팅방 롱프레스 처리
    const handleLongPressRoom = async (roomId) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setIsSelectMode(true);
            setSelectedItems(new Set([roomId]));
        } catch (error) {
            console.warn('Error handling long press:', error);
        }
    };

    // 선택 모드 종료
    const exitSelectMode = async () => {
        try {
            setIsSelectMode(false);
            setSelectedItems(new Set());
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.warn('Error exiting select mode:', error);
        }
    };

    // 채팅방 아이템 렌더링
    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.chatRoom,
                isSelectMode && selectedItems.has(item.id) && styles.selectedRoom
            ]}
            onPress={() => handleSelectRoom(item.id)}
            onLongPress={() => handleLongPressRoom(item.id)}
            delayLongPress={300}
        >
            <View style={styles.chatContent}>
                <Avatar
                    source={item.avatar}
                    size="medium"
                    style={styles.avatar}
                />
                <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>{item.name}</Text>
                    <Text style={styles.lastMessage}>{item.lastMessage}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return <SkeletonLoader type="chatList" />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <SectionList
                sections={sections}
                renderItem={renderItem}
                renderSectionHeader={({ section }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                    </View>
                )}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={async () => {
                            try {
                                setRefreshing(true);
                                await loadChatRooms(true);
                            } catch (error) {
                                console.warn('Error refreshing:', error);
                            }
                        }}
                        colors={[theme.colors.primary.main]}
                    />
                }
                stickySectionHeadersEnabled={false}
                contentContainerStyle={styles.listContent}
            />
            <TouchableOpacity
                style={styles.fabButton}
                onPress={async () => {
                    try {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('FriendTab', {
                            screen: 'FriendList',
                            params: { mode: 'chatSelect' }
                        });
                    } catch (error) {
                        console.warn('Error handling fab press:', error);
                    }
                }}
            >
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    listContent: {
        paddingBottom: theme.spacing.xl,
    },
    sectionHeader: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
    },
    sectionTitle: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    chatRoom: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    selectedRoom: {
        backgroundColor: `${theme.colors.primary.main}10`,
    },
    chatContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        marginRight: theme.spacing.md,
    },
    chatInfo: {
        flex: 1,
    },
    chatName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    lastMessage: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    fabButton: {
        position: 'absolute',
        right: theme.spacing.lg,
        bottom: theme.spacing.lg + (Platform.OS === 'ios' ? 20 : 0),
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 6,
            },
        }),
    },
});