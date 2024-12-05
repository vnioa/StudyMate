import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { settingsAPI } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FontSizeScreen = () => {
    const navigation = useNavigation();
    const [fontSize, setFontSize] = useState(2);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [previewText, setPreviewText] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getFontSettings();
            if (response.data) {
                setFontSize(response.data.fontSize);
                setPreviewText(response.data.previewText || '안녕하세요.\n글자 크기를 조절해보세요.');
                await AsyncStorage.setItem('fontSize', response.data.fontSize.toString());
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getFontSizeText = (value) => {
        if (value <= 1.5) return '작게';
        if (value <= 2.5) return '중간';
        return '크게';
    };

    const handleFontSizeChange = async (value) => {
        try {
            setLoading(true);
            const response = await settingsAPI.updateFontSettings({
                fontSize: value,
                applyGlobally: true
            });

            if (response.data.success) {
                await AsyncStorage.setItem('fontSize', value.toString());
                setFontSize(value);
                Alert.alert('성공', '글자 크기가 변경되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '글자 크기 변경에 실패했습니다.');
            // 실패 시 이전 값으로 복구
            setFontSize(parseFloat(await AsyncStorage.getItem('fontSize')) || 2);
        } finally {
            setLoading(false);
        }
    };

    const getScaledFontSize = (baseSize) => {
        if(!isFinite(fontSize)) return baseSize;
        const scale = Math.max(1, Math.min(3, fontSize)) / 2;
        return Math.round(baseSize * scale);
    };

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
                <TouchableOpacity onPress={() => navigation.goBack()}>
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
                        onRefresh={fetchInitialData}
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
                        <Text style={{ fontSize: getScaledFontSize(14) }}>가</Text>
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
                        <Text style={{ fontSize: getScaledFontSize(24) }}>가</Text>
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
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontWeight: '600',
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
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
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
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
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