// src/screens/study/GroupStudyScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

export default function GroupStudyScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { groupId, studyId } = route.params;
    const webViewRef = useRef(null);
    const chatScrollRef = useRef(null);

    // 상태 관리
    const [studyData, setStudyData] = useState({
        title: '',
        subject: '',
        participants: [],
        materials: [],
        chat: [],
        isLive: false,
        hostId: null,
        currentSlide: 0,
        totalSlides: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isJoined, setIsJoined] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // WebSocket 연결
    useEffect(() => {
        const ws = new WebSocket(`wss://api.studymate.com/study/${studyId}`);

        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            handleWebSocketMessage(data);
        };

        ws.onerror = (e) => {
            console.error('WebSocket error:', e);
        };

        return () => {
            ws.close();
        };
    }, [studyId]);

    // 데이터 로드
    useEffect(() => {
        loadStudyData();
    }, []);

    const loadStudyData = async () => {
        try {
            setIsLoading(true);
            const response = await api.study.getGroupStudy(studyId);
            setStudyData(response);
            setIsJoined(response.participants.some(p => p.id === response.currentUserId));
        } catch (error) {
            Alert.alert('오류', '학습 데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // WebSocket 메시지 처리
    const handleWebSocketMessage = (data) => {
        switch (data.type) {
            case 'PARTICIPANT_JOIN':
                setStudyData(prev => ({
                    ...prev,
                    participants: [...prev.participants, data.participant]
                }));
                break;
            case 'PARTICIPANT_LEAVE':
                setStudyData(prev => ({
                    ...prev,
                    participants: prev.participants.filter(p => p.id !== data.participantId)
                }));
                break;
            case 'CHAT_MESSAGE':
                setStudyData(prev => ({
                    ...prev,
                    chat: [...prev.chat, data.message]
                }));
                chatScrollRef.current?.scrollToEnd();
                break;
            case 'SLIDE_CHANGE':
                if (studyData.hostId !== data.currentUserId) {
                    webViewRef.current?.injectJavaScript(`
            goToSlide(${data.slideNumber});
            true;
          `);
                }
                setStudyData(prev => ({
                    ...prev,
                    currentSlide: data.slideNumber
                }));
                break;
            case 'SCREEN_SHARE_START':
                setStudyData(prev => ({
                    ...prev,
                    screenShareUrl: data.url
                }));
                break;
            case 'SCREEN_SHARE_END':
                setStudyData(prev => ({
                    ...prev,
                    screenShareUrl: null
                }));
                break;
        }
    };

    // 학습 참여
    const handleJoinStudy = async () => {
        try {
            await api.study.joinGroupStudy(studyId);
            setIsJoined(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '학습 참여에 실패했습니다.');
        }
    };

    // 채팅 메시지 전송
    const handleSendMessage = async () => {
        if (!chatMessage.trim()) return;

        try {
            await api.study.sendChatMessage(studyId, chatMessage);
            setChatMessage('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            Alert.alert('오류', '메시지 전송에 실패했습니다.');
        }
    };

    // 화상 통화 토글
    const handleToggleVideo = async () => {
        try {
            if (isVideoEnabled) {
                await api.study.disableVideo(studyId);
            } else {
                await api.study.enableVideo(studyId);
            }
            setIsVideoEnabled(!isVideoEnabled);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            Alert.alert('오류', '비디오 설정 변경에 실패했습니다.');
        }
    };

    // 오디오 토글
    const handleToggleAudio = async () => {
        try {
            if (isAudioEnabled) {
                await api.study.disableAudio(studyId);
            } else {
                await api.study.enableAudio(studyId);
            }
            setIsAudioEnabled(!isAudioEnabled);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            Alert.alert('오류', '오디오 설정 변경에 실패했습니다.');
        }
    };

    // 화면 공유 토글
    const handleToggleScreenShare = async () => {
        try {
            if (isScreenSharing) {
                await api.study.stopScreenShare(studyId);
            } else {
                await api.study.startScreenShare(studyId);
            }
            setIsScreenSharing(!isScreenSharing);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            Alert.alert('오류', '화면 공유 설정 변경에 실패했습니다.');
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    if (!isJoined) {
        return (
            <View style={styles.joinContainer}>
                <Text style={styles.joinTitle}>{studyData.title}</Text>
                <Text style={styles.joinDescription}>
                    현재 {studyData.participants.length}명이 학습 중입니다
                </Text>
                <TouchableOpacity
                    style={styles.joinButton}
                    onPress={handleJoinStudy}
                >
                    <Text style={styles.joinButtonText}>학습 참여하기</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* 학습 콘텐츠 */}
            <View style={styles.contentContainer}>
                {studyData.screenShareUrl ? (
                    <WebView
                        ref={webViewRef}
                        source={{ uri: studyData.screenShareUrl }}
                        style={styles.webview}
                    />
                ) : (
                    <View style={styles.slideContainer}>
                        <WebView
                            ref={webViewRef}
                            source={{ uri: studyData.materials[studyData.currentSlide]?.url }}
                            style={styles.webview}
                        />
                        <View style={styles.slideControls}>
                            <Text style={styles.slideNumber}>
                                {studyData.currentSlide + 1} / {studyData.totalSlides}
                            </Text>
                            {studyData.hostId === studyData.currentUserId && (
                                <View style={styles.slideButtons}>
                                    <TouchableOpacity
                                        style={styles.slideButton}
                                        onPress={() => {
                                            webViewRef.current?.injectJavaScript(`
                        previousSlide();
                        true;
                      `);
                                        }}
                                        disabled={studyData.currentSlide === 0}
                                    >
                                        <Ionicons
                                            name="chevron-back"
                                            size={24}
                                            color={studyData.currentSlide === 0
                                                ? theme.colors.text.disabled
                                                : theme.colors.text.primary
                                            }
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.slideButton}
                                        onPress={() => {
                                            webViewRef.current?.injectJavaScript(`
                        nextSlide();
                        true;
                      `);
                                        }}
                                        disabled={studyData.currentSlide === studyData.totalSlides - 1}
                                    >
                                        <Ionicons
                                            name="chevron-forward"
                                            size={24}
                                            color={studyData.currentSlide === studyData.totalSlides - 1
                                                ? theme.colors.text.disabled
                                                : theme.colors.text.primary
                                            }
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>

            {/* 참여자 목록 */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.participantsContainer}
            >
                {studyData.participants.map((participant, index) => (
                    <View key={index} style={styles.participantItem}>
                        <Avatar
                            source={{ uri: participant.avatar }}
                            size="medium"
                            badge={participant.isHost ? 'host' : null}
                        />
                        <Text style={styles.participantName} numberOfLines={1}>
                            {participant.name}
                        </Text>
                        <View style={styles.participantStatus}>
                            {participant.isVideoEnabled && (
                                <Ionicons name="videocam" size={16} color={theme.colors.primary.main} />
                            )}
                            {participant.isAudioEnabled && (
                                <Ionicons name="mic" size={16} color={theme.colors.primary.main} />
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* 채팅 */}
            <View style={styles.chatContainer}>
                <ScrollView
                    ref={chatScrollRef}
                    style={styles.chatMessages}
                    contentContainerStyle={styles.chatContent}
                >
                    {studyData.chat.map((message, index) => (
                        <View
                            key={index}
                            style={[
                                styles.chatMessage,
                                message.userId === studyData.currentUserId && styles.chatMessageMine
                            ]}
                        >
                            {message.userId !== studyData.currentUserId && (
                                <Text style={styles.chatSender}>{message.sender}</Text>
                            )}
                            <Text style={[
                                styles.chatText,
                                message.userId === studyData.currentUserId && styles.chatTextMine
                            ]}>
                                {message.text}
                            </Text>
                            <Text style={styles.chatTime}>
                                {date.format(message.timestamp, 'HH:mm')}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
                <View style={styles.chatInput}>
                    <TextInput
                        style={styles.chatTextInput}
                        value={chatMessage}
                        onChangeText={setChatMessage}
                        placeholder="메시지를 입력하세요"
                        multiline
                    />
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSendMessage}
                    >
                        <Ionicons name="send" size={24} color={theme.colors.primary.main} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 컨트롤 버튼 */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        isVideoEnabled && styles.controlButtonActive
                    ]}
                    onPress={handleToggleVideo}
                >
                    <Ionicons
                        name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                        size={24}
                        color={isVideoEnabled ? theme.colors.text.contrast : theme.colors.text.primary}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        isAudioEnabled && styles.controlButtonActive
                    ]}
                    onPress={handleToggleAudio}
                >
                    <Ionicons
                        name={isAudioEnabled ? 'mic' : 'mic-off'}
                        size={24}
                        color={isAudioEnabled ? theme.colors.text.contrast : theme.colors.text.primary}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        isScreenSharing && styles.controlButtonActive
                    ]}
                    onPress={handleToggleScreenShare}
                >
                    <Ionicons
                        name="desktop-outline"
                        size={24}
                        color={isScreenSharing ? theme.colors.text.contrast : theme.colors.text.primary}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.controlButton, styles.leaveButton]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="exit-outline" size={24} color={theme.colors.status.error} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    joinContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    joinTitle: {
        fontSize: theme.typography.size.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    joinDescription: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },
    joinButton: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        backgroundColor: theme.colors.primary.main,
        borderRadius: theme.layout.components.borderRadius,
    },
    joinButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    webview: {
        flex: 1,
    },
    slideContainer: {
        flex: 1,
    },
    slideControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
    },
    slideNumber: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    slideButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    slideButton: {
        padding: theme.spacing.sm,
    },
    participantsContainer: {
        maxHeight: 100,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    participantItem: {
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    participantName: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.xs,
        maxWidth: 80,
    },
    participantStatus: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        marginTop: 2,
    },
    chatContainer: {
        height: 300,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    chatMessages: {
        flex: 1,
    },
    chatContent: {
        padding: theme.spacing.md,
    },
    chatMessage: {
        maxWidth: '80%',
        marginBottom: theme.spacing.sm,
    },
    chatMessageMine: {
        alignSelf: 'flex-end',
    },
    chatSender: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    chatText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
    },
    chatTextMine: {
        color: theme.colors.text.contrast,
        backgroundColor: theme.colors.primary.main,
    },
    chatTime: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginTop: 2,
        alignSelf: 'flex-end',
    },
    chatInput: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    chatTextInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginRight: theme.spacing.sm,
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.primary,
    },
    sendButton: {
        padding: theme.spacing.sm,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    controlButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    leaveButton: {
        backgroundColor: theme.colors.status.error + '20',
    }
});