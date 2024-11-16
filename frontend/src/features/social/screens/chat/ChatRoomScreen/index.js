// features/social/screens/chat/ChatRoomScreen/index.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useChat } from '../../../hooks/useChat';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ChatOptions from './components/ChatOptions';
import styles from './styles';

const ChatRoomScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { chatId } = route.params;
    const [showOptions, setShowOptions] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const {
        chatRooms,
        messages,
        loading,
        error,
        isRefreshing,
        sendMessage,
        getMessages,
        updateParticipants,
        togglePin,
        toggleMute,
        deleteMessage,
        uploadFile,
        setTyping
    } = useChat();

    // 현재 채팅방 정보
    const currentChat = chatRooms.find(chat => chat.id === chatId);

    // 옵션 모달 닫기 처리
    const handleCloseOptions = useCallback(() => {
        setShowOptions(false);
    }, []);

    // 채팅방 나가기 처리
    const handleLeaveChat = useCallback(async () => {
        try {
            await updateParticipants(chatId, {
                action: 'remove',
                participants: [{ id: 'currentUserId' }]
            });
            handleCloseOptions();
            navigation.goBack();
        } catch (err) {
            Alert.alert('오류', '채팅방을 나가는데 실패했습니다.');
        }
    }, [chatId, updateParticipants, navigation]);

    // 핀 토글 처리
    const handlePinPress = useCallback(async () => {
        try {
            await togglePin(chatId);
        } catch (err) {
            Alert.alert('오류', '채팅방 고정 상태를 변경하는데 실패했습니다.');
        }
    }, [chatId, togglePin]);

    // 음소거 토글 처리
    const handleMutePress = useCallback(async () => {
        try {
            await toggleMute(chatId);
        } catch (err) {
            Alert.alert('오류', '알림 설정을 변경하는데 실패했습니다.');
        }
    }, [chatId, toggleMute]);

    // 채팅방 정보 표시
    const handleInfoPress = useCallback(() => {
        setShowOptions(true);
    }, []);

    // 타이핑 상태 처리
    const handleTyping = useCallback((typing) => {
        setTyping({
            chatId,
            userId: 'currentUserId',
            isTyping: typing
        });
    }, [chatId, setTyping]);

    // 초기 메시지 로드
    useEffect(() => {
        loadMessages();
    }, [chatId]);

    // 메시지 로드
    const loadMessages = useCallback(async (loadMore = false) => {
        try {
            const newPage = loadMore ? page + 1 : 1;
            const response = await getMessages(chatId, {
                page: newPage,
                limit: 20
            });

            setHasMore(response.pagination.hasNextPage);
            setPage(newPage);
        } catch (err) {
            Alert.alert('오류', '메시지를 불러오는데 실패했습니다.');
        }
    }, [chatId, page, getMessages]);

    // 에러 처리
    useEffect(() => {
        if (error) {
            Alert.alert('오류', error);
        }
    }, [error]);

    if (!currentChat) {
        return null;
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <View style={styles.container}>
                <ChatHeader
                    chatId={chatId}
                    title={currentChat.title}
                    participants={currentChat.participants}
                    thumbnail={currentChat.thumbnail}
                    isGroup={currentChat.isGroup}
                    isOnline={currentChat.isOnline}
                    isPinned={currentChat.isPinned}
                    isMuted={currentChat.isMuted}
                    onPinPress={handlePinPress}
                    onMutePress={handleMutePress}
                    onInfoPress={handleInfoPress}
                />

                <MessageList
                    chatId={chatId}
                    messages={messages[chatId]?.items || []}
                    onLoadMore={loadMessages}
                    hasMore={hasMore}
                    isLoadingMore={loading}
                    onRefresh={() => loadMessages(false)}
                    isRefreshing={isRefreshing}
                    onDeleteMessage={deleteMessage}
                />

                <MessageInput
                    chatId={chatId}
                    onSendMessage={sendMessage}
                    onFileUpload={uploadFile}
                    onTyping={handleTyping}
                />

                <ChatOptions
                    isVisible={showOptions}
                    onClose={() => setShowOptions(false)}
                    chatId={chatId}
                    isGroup={currentChat.isGroup}
                    isPinned={currentChat.isPinned}
                    isMuted={currentChat.isMuted}
                    participants={currentChat.participants}
                    onLeaveChat={handleLeaveChat()}
                />
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatRoomScreen;