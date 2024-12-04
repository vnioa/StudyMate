import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Switch,
    ScrollView,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { settingsAPI } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DisplayModeScreen = () => {
    const navigation = useNavigation();
    const [selectedMode, setSelectedMode] = useState('light');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [settings, setSettings] = useState({
        autoMode: false,
        schedule: {
            start: '18:00',
            end: '06:00'
        }
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchCurrentMode(),
                fetchDisplaySettings()
            ]);
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchCurrentMode = async () => {
        try {
            const response = await settingsAPI.getCurrentDisplayMode();
            if (response.data) {
                const { mode } = response.data;
                setSelectedMode(mode);
                await AsyncStorage.setItem('displayMode', mode);
            }
        } catch (error) {
            console.error('Display mode fetch failed:', error);
        }
    };

    const fetchDisplaySettings = async () => {
        try {
            const response = await settingsAPI.getDisplaySettings();
            if (response.data) {
                setSettings(response.data);
            }
        } catch (error) {
            console.error('Display settings fetch failed:', error);
        }
    };

    const handleModeChange = async (mode) => {
        if (mode === selectedMode) return;

        try {
            setLoading(true);
            const response = await settingsAPI.updateDisplayMode({
                mode,
                autoMode: settings.autoMode,
                schedule: settings.schedule
            });

            if (response.data.success) {
                await AsyncStorage.setItem('displayMode', mode);
                setSelectedMode(mode);
                Alert.alert('성공', '화면 모드가 변경되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '화면 모드 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoModeToggle = async (value) => {
        try {
            setLoading(true);
            const response = await settingsAPI.updateDisplaySettings({
                ...settings,
                autoMode: value
            });

            if (response.data.success) {
                setSettings(prev => ({
                    ...prev,
                    autoMode: value
                }));
            }
        } catch (error) {
            Alert.alert('오류', '설정 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !selectedMode) {
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
                <Text style={styles.headerTitle}>화면 모드</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchInitialData}
                        colors={['#4A90E2']}
                    />
                }
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>모드 선택</Text>
                    <TouchableOpacity
                        style={[
                            styles.option,
                            selectedMode === 'light' && styles.selectedOption
                        ]}
                        onPress={() => handleModeChange('light')}
                        disabled={loading || settings.autoMode}
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
                        disabled={loading || settings.autoMode}
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

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>자동 설정</Text>
                    <View style={styles.settingItem}>
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>자동 모드 변경</Text>
                            <Text style={styles.settingDescription}>
                                시간에 따라 자동으로 모드가 변경됩니다
                            </Text>
                        </View>
                        <Switch
                            value={settings.autoMode}
                            onValueChange={handleAutoModeToggle}
                            disabled={loading}
                            trackColor={{ false: "#767577", true: "#4A90E2" }}
                        />
                    </View>
                </View>

                {settings.autoMode && (
                    <Text style={styles.scheduleInfo}>
                        {settings.schedule.start} ~ {settings.schedule.end}
                        동안 다크 모드가 적용됩니다
                    </Text>
                )}
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
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    selectedOption: {
        backgroundColor: '#f8f9fa',
        borderColor: '#4A90E2',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
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
        borderColor: '#4A90E2',
        backgroundColor: '#4A90E2',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
        color: '#333',
    },
    settingDescription: {
        fontSize: 14,
        color: '#666',
    },
    scheduleInfo: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        padding: 16,
    }
});

export default DisplayModeScreen;