import {useState, useEffect, useCallback, useRef} from 'react';
import {
    View,
    Text,
    Animated,
    StyleSheet,
    TouchableOpacity,
    SectionList,
    TextInput,
    Platform,
    StatusBar,
    RefreshControl,
    Keyboard,
    Alert,
    Vibration
} from "react-native";
import {Swipeable} from "react-native-gesture-handler";
import {Ionicons} from "@expo/vector-icons";
import {useNavigation, useIsFocused} from "@react-navigation/native";
import {SafeAreaView} from "react-native";
import * as Haptics from 'expo-haptics';
import {theme} from '../../utils/styles';
import {date} from '../../utils/helpers';
import api from '../../services/api';
import socket from '../../services/socket';
import {Avatar, SkeletonLoader} from '../../components/UI';

export default function ChatListScreen(){
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    // Refs
    const searchInputRef = useRef(null);
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
    const [searchText, setSearchText] = useState('');
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [sortBy, setSortBy] = useState('recent'); // recent, unread, alphabetical

    // 애니메이션 값
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [Platform.OS === 'ios' ? 130 : 110, Platform.OS === 'ios' ? 90 : 70],
        extrapolate: 'clamp'
    });

    // 데이터 로딩
    const loadChatRooms = async (shouldRefresh = false) => {
        try {
            if (!shouldRefresh) setIsLoading(true);
            const response = await api.chat.getRooms();

            // 채팅방 분류
            const pinnedRooms = response.filter(room => room.isPinned);
            const groupRooms = response.filter(room => !room.isPinned && room.isGroup);
            const personalRooms = response.filter(room => !room.isPinned && !room.isGroup);

            // 정렬 적용
            const sortRooms = (rooms) => {
                switch (sortBy) {
                    case 'recent':
                        return rooms.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
                    case 'unread':
                        return rooms.sort((a, b) => b.unreadCount - a.unreadCount);
                    case 'alphabetical':
                        return rooms.sort((a, b) => {
                            const nameA = a.isGroup ? a.name : a.participants[0].name;
                            const nameB = b.isGroup ? b.name : b.participants[0].name;
                            return nameA.localeCompare(nameB);
                        });
                    default:
                        return rooms;
                }
            };

            setSections([
                { title: '고정된 채팅', data: sortRooms(pinnedRooms) },
                { title: '그룹 채팅', data: sortRooms(groupRooms) },
                { title: '개인 채팅', data: sortRooms(personalRooms) }
            ]);
        } catch (error) {
            Alert.alert('오류', '채팅방 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 초기 로딩 및 소켓 이벤트 설정
    useEffect(() => {
        if (isFocused) {
            loadChatRooms();
            socket.on('chat:newMessage', handleNewMessage);
            socket.on('chat:updateRoom', handleRoomUpdate);
            socket.on('chat:deleteRoom', handleRoomDelete);
        }

        return () => {
            socket.off('chat:newMessage');
            socket.off('chat:updateRoom');
            socket.off('chat:deleteRoom');
        };
    }, [isFocused, sortBy]);

    // 스크롤 이벤트 처리
    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: false,
            listener: (event) => {
                const offsetY = event.nativeEvent.contentOffset.y;
                if (offsetY > 50) {
                    Animated.spring(fabAnim, {
                        toValue: 0,
                        useNativeDriver: true
                    }).start();
                } else {
                    Animated.spring(fabAnim, {
                        toValue: 1,
                        useNativeDriver: true
                    }).start();
                }
            }
        }
    );

    // 채팅방 선택 처리
    const handleSelectRoom = (roomId) => {
        if (isSelectMode) {
            const newSelected = new Set(selectedItems);
            if (newSelected.has(roomId)) {
                newSelected.delete(roomId);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
                newSelected.add(roomId);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setSelectedItems(newSelected);
        } else {
            navigation.navigate('ChatRoom', { roomId });
        }
    };

    // 채팅방 롱프레스 처리
    const handleLongPressRoom = (roomId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setIsSelectMode(true);
        setSelectedItems(new Set([roomId]));
    };

    // 선택 모드 종료
    const exitSelectMode = () => {
        setIsSelectMode(false);
        setSelectedItems(new Set());
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 선택된 채팅방 일괄 처리
    const handleBulkAction = async (action) => {
        try {
            const roomIds = Array.from(selectedItems);
            switch (action) {
                case 'delete':
                    Alert.alert(
                        '채팅방 나가기',
                        `선택한 ${roomIds.length}개의 채팅방에서 나가시겠습니까?`,
                        [
                            { text: '취소', style: 'cancel' },
                            {
                                text: '나가기',
                                style: 'destructive',
                                onPress: async () => {
                                    await Promise.all(roomIds.map(id => api.chat.deleteRoom(id)));
                                    loadChatRooms(true);
                                    exitSelectMode();
                                }
                            }
                        ]
                    );
                    break;
                case 'read':
                    await Promise.all(roomIds.map(id => api.chat.markAsRead(id)));
                    loadChatRooms(true);
                    exitSelectMode();
                    break;
                case 'pin':
                    await Promise.all(roomIds.map(id => api.chat.togglePin(id)));
                    loadChatRooms(true);
                    exitSelectMode();
                    break;
            }
        } catch (error) {
            Alert.alert('오류', '작업을 처리하는데 실패했습니다.');
        }
    };

    // 채팅방 아이템 렌더링
    const renderItem = ({ item }) => (
        <Swipeable
            ref={ref => swipeableRefs.current[item.id] = ref}
            renderRightActions={() => (
                <View style={styles.swipeActions}>
                    <TouchableOpacity
                        style={[styles.swipeAction, { backgroundColor: theme.colors.primary.main }]}
                        onPress={() => {
                            swipeableRefs.current[item.id]?.close();
                            api.chat.togglePin(item.id);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <Ionicons
                            name={item.isPinned ? 'pin-outline' : 'pin'}
                            size={24}
                            color="white"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.swipeAction, { backgroundColor: theme.colors.status.error }]}
                        onPress={() => {
                            swipeableRefs.current[item.id]?.close();
                            Alert.alert(
                                '채팅방 나가기',
                                '이 채팅방에서 나가시겠습니까?',
                                [
                                    { text: '취소', style: 'cancel' },
                                    {
                                        text: '나가기',
                                        style: 'destructive',
                                        onPress: async () => {
                                            await api.chat.deleteRoom(item.id);
                                            loadChatRooms(true);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <Ionicons name="trash-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            )}
            enabled={!isSelectMode}
        >
            <TouchableOpacity
                style={[
                    styles.chatRoom,
                    isSelectMode && selectedItems.has(item.id) && styles.selectedRoom
                ]}
                onPress={() => handleSelectRoom(item.id)}
                onLongPress={() => handleLongPressRoom(item.id)}
                delayLongPress={300}
            >
                {/* 채팅방 내용 */}
            </TouchableOpacity>
        </Swipeable>
    );

    // 섹션 헤더 렌더링
    const renderSectionHeader = ({ section }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
    );

    if (isLoading) {
        return <SkeletonLoader type="chatList" />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.header, { height: headerHeight }]}>
                {/* 헤더 내용 */}
            </Animated.View>

            <SectionList
                sections={sections}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={item => item.id}
                onScroll={handleScroll}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadChatRooms(true);
                        }}
                        colors={[theme.colors.primary.main]}
                    />
                }
                stickySectionHeadersEnabled={false}
                contentContainerStyle={styles.listContent}
            />

            <Animated.View
                style={[
                    styles.fab,
                    {
                        transform: [
                            {
                                scale: fabAnim
                            },
                            {
                                translateY: fabAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [100, 0]
                                })
                            }
                        ]
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.fabButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('FriendTab', {
                            screen: 'FriendList',
                            params: { mode: 'chatSelect' }
                        });
                    }}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    header: {
        backgroundColor: theme.colors.background.primary,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        zIndex: 1000,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 56,
    },
    headerTitle: {
        fontSize: theme.typography.size.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        paddingHorizontal: theme.spacing.md,
        height: 40,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.primary,
        paddingVertical: theme.spacing.xs,
    },
    searchCancel: {
        paddingHorizontal: theme.spacing.sm,
    },
    searchCancelText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
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
        backgroundColor: theme.colors.primary.main + '10',
    },
    avatarContainer: {
        marginRight: theme.spacing.md,
    },
    groupAvatarBadge: {
        position: 'absolute',
        right: -4,
        bottom: -4,
        backgroundColor: theme.colors.primary.main,
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    groupAvatarBadgeText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    chatInfo: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        flex: 1,
    },
    timeText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.sm,
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        flex: 1,
    },
    unreadBadge: {
        backgroundColor: theme.colors.primary.main,
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: theme.spacing.sm,
    },
    unreadCount: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    swipeActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    swipeAction: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
    },
    fab: {
        position: 'absolute',
        right: theme.spacing.lg,
        bottom: theme.spacing.lg + (Platform.OS === 'ios' ? 20 : 0),
        zIndex: 1000,
    },
    fabButton: {
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
    selectModeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.primary.main,
    },
    selectModeTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    selectModeActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl * 2,
    },
    emptyIcon: {
        marginBottom: theme.spacing.lg,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    sortButton: {
        padding: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.background.secondary,
    },
    sortButtonText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
});