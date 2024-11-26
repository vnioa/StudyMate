import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { settingsAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FontSizeScreen = () => {
    const navigation = useNavigation();
    const [fontSize, setFontSize] = useState(2);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCurrentFontSize();
    }, []);

    const fetchCurrentFontSize = async () => {
        try {
            const savedFontSize = await AsyncStorage.getItem('fontSize');
            if (savedFontSize) {
                setFontSize(parseFloat(savedFontSize));
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
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
            const response = await settingsAPI.updateFontSize(value);

            if (response.data.success) {
                await AsyncStorage.setItem('fontSize', value.toString());
                setFontSize(value);
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '글자 크기 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getScaledFontSize = (baseSize) => {
        const scale = fontSize / 2; // 2가 기본 크기
        return baseSize * scale;
    };

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

            <View style={styles.content}>
                <View style={styles.sliderContainer}>
                    <Text style={{ fontSize: getScaledFontSize(16) }}>가</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={3}
                        step={1}
                        value={fontSize}
                        onValueChange={setFontSize}
                        onSlidingComplete={handleFontSizeChange}
                        minimumTrackTintColor="#0066FF"
                        maximumTrackTintColor="#DEDEDE"
                        disabled={loading}
                    />
                    <Text style={{ fontSize: getScaledFontSize(24) }}>가</Text>
                </View>

                <Text style={[styles.currentSize, { fontSize: getScaledFontSize(18) }]}>
                    {getFontSizeText(fontSize)}
                </Text>

                <Text style={[styles.description, { fontSize: getScaledFontSize(14) }]}>
                    설정한 글자 크기는 앱 전체에 적용됩니다.
                </Text>
            </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 30,
    },
    slider: {
        flex: 1,
        marginHorizontal: 20,
    },
    currentSize: {
        fontWeight: 'bold',
        marginBottom: 20,
    },
    description: {
        color: '#666',
        textAlign: 'center',
    },
});

export default FontSizeScreen;