import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../api/api';

const FontSizeScreen = ({ navigation }) => {
    const [fontSize, setFontSize] = useState(2);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [previewText, setPreviewText] = useState('');

    const fetchFontSettings = useCallback(async () => {
        try {
            setLoading(true);
            const [settingsResponse, previewResponse] = await Promise.all([
                api.get('/settings/font-size'),
                api.get('/settings/preview-text')
            ]);

            if (settingsResponse.data) {
                setFontSize(settingsResponse.data.size);
                await AsyncStorage.setItem('fontSize', settingsResponse.data.size.toString());
            }

            if (previewResponse.data) {
                setPreviewText(previewResponse.data.text || '안녕하세요.\n글자 크기를 조절해보세요.');
            }
        } catch (error) {
            const cachedSize = await AsyncStorage.getItem('fontSize');
            if (cachedSize) {
                setFontSize(parseFloat(cachedSize));
            }
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchFontSettings();
            return () => {
                setFontSize(2);
                setPreviewText('');
            };
        }, [fetchFontSettings])
    );

    const getFontSizeText = useCallback((value) => {
        if (value <= 1.5) return '작게';
        if (value <= 2.5) return '중간';
        return '크게';
    }, []);

    const handleFontSizeChange = useCallback(async (value) => {
        try {
            setLoading(true);
            const response = await api.put('/settings/font-size', {
                size: value,
                applyGlobally: true
            });

            if (response.data.success) {
                await AsyncStorage.setItem('fontSize', value.toString());
                setFontSize(value);
            }
        } catch (error) {
            Alert.alert('오류', '글자 크기 변경에 실패했습니다.');
            const cachedSize = await AsyncStorage.getItem('fontSize');
            if (cachedSize) {
                setFontSize(parseFloat(cachedSize));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const getScaledFontSize = useCallback((baseSize) => {
        if (!isFinite(fontSize)) return baseSize;
        const scale = Math.max(1, Math.min(3, fontSize)) / 2;
        return Math.round(baseSize * scale);
    }, [fontSize]);

    if (loading && !fontSize) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
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
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: getScaledFontSize(18) }]}>
                    글자 크기
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchFontSettings}
                        colors={['#4A90E2']}
                    />
                }
            >
                <View style={styles.previewCard}>
                    <Text style={[styles.previewText, { fontSize: getScaledFontSize(16) }]}>
                        {previewText}
                    </Text>
                </View>

                <View style={styles.sliderSection}>
                    <View style={styles.sliderContainer}>
                        <Text style={styles.sizeIndicator}>가</Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={3}
                            step={0.5}
                            value={fontSize}
                            onValueChange={setFontSize}
                            onSlidingComplete={handleFontSizeChange}
                            minimumTrackTintColor="#4A90E2"
                            maximumTrackTintColor="#DEDEDE"
                            thumbTintColor="#4A90E2"
                            disabled={loading}
                        />
                        <Text style={[styles.sizeIndicator, { fontSize: 24 }]}>가</Text>
                    </View>

                    <Text style={[styles.currentSize, { fontSize: getScaledFontSize(18) }]}>
                        {getFontSizeText(fontSize)}
                    </Text>
                </View>

                <Text style={[styles.description, { fontSize: getScaledFontSize(14) }]}>
                    설정한 글자 크기는 앱 전체에 적용됩니다.
                </Text>
            </ScrollView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontWeight: '600',
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        alignItems: 'center',
    },
    previewCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    previewText: {
        textAlign: 'center',
        lineHeight: 24,
    },
    sliderSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    slider: {
        flex: 1,
        marginHorizontal: 16,
        height: 40,
    },
    sizeIndicator: {
        fontSize: 14,
        color: '#333',
    },
    currentSize: {
        textAlign: 'center',
        fontWeight: '600',
        color: '#4A90E2',
    },
    description: {
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
});

export default FontSizeScreen;