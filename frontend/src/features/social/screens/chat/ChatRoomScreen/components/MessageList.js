// features/social/screens/chat/ChatRoomScreen/components/MessageList.js
import React, { useRef, useEffect, useCallback } from 'react';
import {View, FlatList, RefreshControl, ActivityIndicator, Alert} from 'react-native';
import MessageItem from './MessageItem';
import { useChat } from '../../../../hooks/useChat';
import styles from '../styles';

const MessageList = ({
                         chatId,
                         messages = [],
                         onLoadMore,
                         hasMore = false,
                         isLoadingMore = false,
                         onRefresh,
                         isRefreshing = false
                     }) => {
    const listRef = useRef(null);
    const { updateMessage, deleteMessage } = useChat();

    // 메시지 롱프레스 처리
    const handleMessageLongPress = useCallback((message) => {
        const options = [
            {
                text: '수정',
                onPress: () => {
                    Alert.prompt(
                        '메시지 수정',
                        '수정할 내용을 입력하세요.',
                        [
                            {
                                text: '취소',
                                style: 'cancel'
                            },
                            {
                                text: '수정',
                                onPress: async (newContent) => {
                                    if (newContent?.trim()) {
                                        await updateMessage(chatId, message.id, {
                                            content: newContent.trim(),
                                            updatedAt: new Date().toISOString()
                                        });
                                    }
                                }
                            }
                        ],
                        'plain-text',
                        message.content
                    );
                }
            },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteMessage(chatId, message.id);
                    } catch (error) {
                        Alert.alert('오류', '메시지 삭제에 실패했습니다.');
                    }
                }
            },
            {
                text: '취소',
                style: 'cancel'
            }
        ];

        if (message.type === 'file') {
            options.unshift({
                text: '다운로드',
                onPress: () => handleFilePress(message)
            });
        }

        Alert.alert('메시지 옵션', '', options);
    }, [chatId, updateMessage, deleteMessage]);

    // 파일 처리
    const handleFilePress = useCallback((message) => {
        if (message.type === 'file') {
            // 파일 다운로드 또는 미리보기 처리
            console.log('File pressed:', message.content);
        }
    }, []);

    // 스크롤 하단으로 이동
    const scrollToBottom = useCallback(() => {
        if (listRef.current && messages.length > 0) {
            listRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    }, [messages.length]);

    // 새 메시지 도착시 스크롤
    useEffect(() => {
        scrollToBottom();
    }, [messages.length, scrollToBottom]);

    // 메시지 렌더링
    const renderMessage = useCallback(({ item: message, index }) => {
        const previousMessage = messages[index + 1];
        const nextMessage = messages[index - 1];
        const isMyMessage = message.sender.id === 'currentUserId'; // 실제 사용자 ID로 변경 필요

        return (
            <MessageItem
                message={message}
                isMyMessage={isMyMessage}
                previousMessage={previousMessage}
                nextMessage={nextMessage}
                onLongPress={handleMessageLongPress}
                onFilePress={handleFilePress}
            />
        );
    }, [handleMessageLongPress, handleFilePress, messages]);

    // 구분선 렌더링
    const renderSeparator = useCallback(() => (
        <View style={styles.messageSeparator} />
    ), []);

    // 로딩 표시
    const renderFooter = useCallback(() => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#0057D9" />
            </View>
        );
    }, [isLoadingMore]);

    // 스크롤 이벤트 처리
    const handleScroll = useCallback(({ nativeEvent }) => {
        if (isLoadingMore || !hasMore) return;

        const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
        const isCloseToTop = contentOffset.y >= contentSize.height - layoutMeasurement.height * 3;

        if (isCloseToTop) {
            onLoadMore?.();
        }
    }, [isLoadingMore, hasMore, onLoadMore]);

    return (
        <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            inverted
            contentContainerStyle={styles.messageList}
            ItemSeparatorComponent={renderSeparator}
            ListFooterComponent={renderFooter}
            onScroll={handleScroll}
            scrollEventThrottle={400}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    colors={['#0057D9']}
                    tintColor="#0057D9"
                />
            }
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={true}
            maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10
            }}
        />
    );
};

MessageList.defaultProps = {
    messages: [],
    hasMore: false,
    isLoadingMore: false,
    isRefreshing: false,
    onLoadMore: null,
    onRefresh: null
};

export default React.memo(MessageList);