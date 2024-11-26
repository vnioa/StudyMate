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
import { settingsAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DisplayModeScreen = () => {
    const navigation = useNavigation();
    const [selectedMode, setSelectedMode] = useState('light');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCurrentMode();
    }, []);

    const fetchCurrentMode = async () => {
        try {
            const savedMode = await AsyncStorage.getItem('displayMode');
            if (savedMode) {
                setSelectedMode(savedMode);
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
        }
    };

    const handleModeChange = async (mode) => {
        if (mode === selectedMode) return;

        try {
            setLoading(true);
            const response = await settingsAPI.updateDisplayMode(mode);

            if (response.data.success) {
                await AsyncStorage.setItem('displayMode', mode);
                setSelectedMode(mode);
                Alert.alert('알림', '화면 모드가 변경되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '화면 모드 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>화면 모드</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={[
                        styles.option,
                        selectedMode === 'light' && styles.selectedOption
                    ]}
                    onPress={() => handleModeChange('light')}
                    disabled={loading}
                >
                    <View style={styles.optionContent}>
                        <Icon name="sun" size={24} color="#333" />
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>라이트 모드</Text>
                            <Text style={styles.optionDescription}>
                                밝은 화면으로 표시됩니다
                            </Text>
                        </View>
                    </View>
                    <View style={[
                        styles.radio,
                        selectedMode === 'light' && styles.radioSelected
                    ]} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.option,
                        selectedMode === 'dark' && styles.selectedOption
                    ]}
                    onPress={() => handleModeChange('dark')}
                    disabled={loading}
                >
                    <View style={styles.optionContent}>
                        <Icon name="moon" size={24} color="#333" />
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>다크 모드</Text>
                            <Text style={styles.optionDescription}>
                                어두운 화면으로 표시됩니다
                            </Text>
                        </View>
                    </View>
                    <View style={[
                        styles.radio,
                        selectedMode === 'dark' && styles.radioSelected
                    ]} />
                </TouchableOpacity>
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
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectedOption: {
        backgroundColor: '#f8f9fa',
        borderColor: '#0066FF',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 14,
        color: '#666',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    radioSelected: {
        borderColor: '#0066FF',
        backgroundColor: '#0066FF',
    },
});

export default DisplayModeScreen;