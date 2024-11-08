// src/screens/study/StudyMaterialScreen.js

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
    Alert,
    ActivityIndicator,
    Share,
    Dimensions
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function StudyMaterialScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { materialId, studyId } = route.params;
    const webViewRef = useRef(null);

    // 상태 관리
    const [material, setMaterial] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [notes, setNotes] = useState([]);
    const [noteText, setNoteText] = useState('');
    const [showNotes, setShowNotes] = useState(false);
    const [bookmarks, setBookmarks] = useState([]);

    // 자료 데이터 로드
    useEffect(() => {
        loadMaterialData();
    }, []);

    const loadMaterialData = async () => {
        try {
            setIsLoading(true);
            const [materialData, notesData, bookmarksData] = await Promise.all([
                api.study.getMaterial(materialId),
                api.study.getMaterialNotes(materialId),
                api.study.getMaterialBookmarks(materialId)
            ]);

            setMaterial(materialData);
            setNotes(notesData);
            setBookmarks(bookmarksData);
            setTotalPages(materialData.totalPages || 1);

            // 마지막 학습 위치로 이동
            if (materialData.lastPage) {
                setCurrentPage(materialData.lastPage);
                webViewRef.current?.injectJavaScript(`
          goToPage(${materialData.lastPage});
          true;
        `);
            }
        } catch (error) {
            Alert.alert('오류', '학습 자료를 불러오는데 실패했습니다.');
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    // 페이지 변경 처리
    const handlePageChange = async (newPage) => {
        setCurrentPage(newPage);
        try {
            await api.study.updateLastPage(materialId, newPage);
        } catch (error) {
            console.error('Failed to update last page:', error);
        }
    };

    // 자료 다운로드
    const handleDownload = async () => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('권한 필요', '파일을 저장하기 위해 저장소 접근 권한이 필요합니다.');
                return;
            }

            setIsDownloading(true);
            const callback = (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                setDownloadProgress(progress);
            };

            const downloadResumable = FileSystem.createDownloadResumable(
                material.downloadUrl,
                FileSystem.documentDirectory + material.fileName,
                {},
                callback
            );

            const { uri } = await downloadResumable.downloadAsync();
            const asset = await MediaLibrary.createAssetAsync(uri);
            await MediaLibrary.createAlbumAsync('StudyMate', asset, false);

            Alert.alert('완료', '파일이 성공적으로 다운로드되었습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '파일 다운로드에 실패했습니다.');
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    // 노트 추가
    const handleAddNote = async () => {
        if (!noteText.trim()) return;

        try {
            const newNote = await api.study.addMaterialNote(materialId, {
                text: noteText,
                page: currentPage
            });

            setNotes(prev => [...prev, newNote]);
            setNoteText('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            Alert.alert('오류', '노트 추가에 실패했습니다.');
        }
    };

    // 북마크 토글
    const handleToggleBookmark = async () => {
        try {
            const isBookmarked = bookmarks.some(b => b.page === currentPage);
            if (isBookmarked) {
                await api.study.removeBookmark(materialId, currentPage);
                setBookmarks(prev => prev.filter(b => b.page !== currentPage));
            } else {
                const newBookmark = await api.study.addBookmark(materialId, currentPage);
                setBookmarks(prev => [...prev, newBookmark]);
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            Alert.alert('오류', '북마크 설정에 실패했습니다.');
        }
    };

    // 자료 공유
    const handleShare = async () => {
        try {
            await Share.share({
                message: `${material.title} - StudyMate 학습 자료`,
                url: material.shareUrl
            });
        } catch (error) {
            console.error('Share error:', error);
        }
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
            {/* 자료 뷰어 */}
            <View style={styles.viewerContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: material.viewerUrl }}
                    style={styles.webview}
                    onMessage={(event) => {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'PAGE_CHANGE') {
                            handlePageChange(data.page);
                        }
                    }}
                />

                {/* 페이지 컨트롤 */}
                <View style={styles.pageControls}>
                    <TouchableOpacity
                        style={styles.pageButton}
                        onPress={() => {
                            webViewRef.current?.injectJavaScript(`
                previousPage();
                true;
              `);
                        }}
                        disabled={currentPage === 1}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={24}
                            color={currentPage === 1
                                ? theme.colors.text.disabled
                                : theme.colors.text.primary
                            }
                        />
                    </TouchableOpacity>
                    <Text style={styles.pageNumber}>
                        {currentPage} / {totalPages}
                    </Text>
                    <TouchableOpacity
                        style={styles.pageButton}
                        onPress={() => {
                            webViewRef.current?.injectJavaScript(`
                nextPage();
                true;
              `);
                        }}
                        disabled={currentPage === totalPages}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={currentPage === totalPages
                                ? theme.colors.text.disabled
                                : theme.colors.text.primary
                            }
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 하단 컨트롤 */}
            <View style={styles.bottomControls}>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => setShowNotes(!showNotes)}
                >
                    <Ionicons
                        name="document-text-outline"
                        size={24}
                        color={theme.colors.text.primary}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleToggleBookmark}
                >
                    <Ionicons
                        name={bookmarks.some(b => b.page === currentPage)
                            ? "bookmark"
                            : "bookmark-outline"
                        }
                        size={24}
                        color={theme.colors.primary.main}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleDownload}
                    disabled={isDownloading}
                >
                    {isDownloading ? (
                        <ActivityIndicator color={theme.colors.primary.main} />
                    ) : (
                        <Ionicons
                            name="download-outline"
                            size={24}
                            color={theme.colors.text.primary}
                        />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleShare}
                >
                    <Ionicons
                        name="share-outline"
                        size={24}
                        color={theme.colors.text.primary}
                    />
                </TouchableOpacity>
            </View>

            {/* 노트 패널 */}
            {showNotes && (
                <View style={styles.notesPanel}>
                    <View style={styles.notesHeader}>
                        <Text style={styles.notesTitle}>학습 노트</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowNotes(false)}
                        >
                            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.notesList}>
                        {notes.map((note, index) => (
                            <View key={index} style={styles.noteItem}>
                                <Text style={styles.noteText}>{note.text}</Text>
                                <View style={styles.noteMeta}>
                                    <Text style={styles.notePage}>p.{note.page}</Text>
                                    <Text style={styles.noteTime}>
                                        {date.formatRelative(note.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.noteInput}>
                        <TextInput
                            style={styles.noteTextInput}
                            value={noteText}
                            onChangeText={setNoteText}
                            placeholder="노트를 입력하세요"
                            multiline
                        />
                        <TouchableOpacity
                            style={styles.addNoteButton}
                            onPress={handleAddNote}
                        >
                            <Text style={styles.addNoteButtonText}>추가</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
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
    viewerContainer: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    pageControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    pageButton: {
        padding: theme.spacing.sm,
    },
    pageNumber: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    bottomControls: {
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
    notesPanel: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 300,
        backgroundColor: theme.colors.background.primary,
        borderLeftWidth: 1,
        borderLeftColor: theme.colors.border,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 0 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    notesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    notesTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    closeButton: {
        padding: theme.spacing.sm,
    },
    notesList: {
        flex: 1,
    },
    noteItem: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    noteText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    noteMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    notePage: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    noteTime: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    noteInput: {
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    noteTextInput: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        padding: theme.spacing.md,
        minHeight: 80,
        textAlignVertical: 'top',
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    addNoteButton: {
        backgroundColor: theme.colors.primary.main,
        padding: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        alignItems: 'center',
    },
    addNoteButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    }
});