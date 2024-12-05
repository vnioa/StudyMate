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
import { storageAPI } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DataStorageScreen = () => {
    const navigation = useNavigation();
    const [selectedStorage, setSelectedStorage] = useState('device');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [currentStorage, setCurrentStorage] = useState(null);
    const [storageStats, setStorageStats] = useState({
        deviceStorage: 0,
        cloudStorage: 0,
        lastSync: null
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchCurrentStorage(),
                fetchStorageStats()
            ]);
        } catch (error) {
            Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchCurrentStorage = async () => {
        try {
            const response = await storageAPI.getCurrentStorage();
            if (response.data) {
                const storageType = response.data.type;
                setSelectedStorage(storageType);
                setCurrentStorage(storageType);
                await AsyncStorage.setItem('storageType', storageType);
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
        }
    };

    const fetchStorageStats = async () => {
        try {
            const response = await storageAPI.getStorageStats();
            if (response.data) {
                setStorageStats(response.data);
            }
        } catch (error) {
            console.error('Storage stats fetch failed:', error);
        }
    };

    const handleStorageChange = async (type) => {
        if (type === currentStorage) return;

        Alert.alert(
            '저장소 변경',
            '저장소를 변경하시겠습니까? 기존 데이터는 새로운 저장소로 이전됩니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '변경',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const response = await storageAPI.changeStorageType({
                                type,
                                transferData: true
                            });

                            if (response.data.success) {
                                await AsyncStorage.setItem('storageType', type);
                                setSelectedStorage(type);
                                setCurrentStorage(type);
                                await fetchStorageStats();
                                Alert.alert('성공', '저장소가 변경되었습니다.');
                            }
                        } catch (error) {
                            Alert.alert('오류', '저장소 변경에 실패했습니다.');
                            setSelectedStorage(currentStorage);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDataSync = async () => {
        try {
            setLoading(true);
            const response = await storageAPI.syncData();
            if (response.data.success) {
                await fetchStorageStats();
                Alert.alert('성공', '데이터 동기화가 완료되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '데이터 동기화에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading && !currentStorage) {
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
                <Text style={styles.headerTitle}>데이터 저장</Text>
                <TouchableOpacity onPress={handleDataSync} disabled={loading}>
                    <Icon name="refresh-cw" size={24} color="#333" />
                </TouchableOpacity>
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
                <Text style={styles.question}>어디에 데이터를 저장할까요?</Text>

                <TouchableOpacity
                    style={[
                        styles.option,
                        selectedStorage === 'device' && styles.selectedOption
                    ]}
                    onPress={() => handleStorageChange('device')}
                    disabled={loading}
                >
                    <View style={styles.optionContent}>
                        <Icon name="smartphone" size={24} color="#333" />
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>기기에 저장</Text>
                            <Text style={styles.optionDescription}>
                                데이터가 이 기기에만 저장됩니다.
                            </Text>
                            <Text style={styles.storageInfo}>
                                사용 중: {formatBytes(storageStats.deviceStorage)}
                            </Text>
                        </View>
                    </View>
                    <View style={[
                        styles.radio,
                        selectedStorage === 'device' && styles.radioSelected
                    ]} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.option,
                        selectedStorage === 'cloud' && styles.selectedOption
                    ]}
                    onPress={() => handleStorageChange('cloud')}
                    disabled={loading}
                >
                    <View style={styles.optionContent}>
                        <Icon name="cloud" size={24} color="#333" />
                        <View style={styles.optionTextContainer}>
                            <Text style={styles.optionTitle}>클라우드에 저장</Text>
                            <Text style={styles.optionDescription}>
                                데이터가 클라우드에 안전하게 저장됩니다.
                            </Text>
                            <Text style={styles.storageInfo}>
                                사용 중: {formatBytes(storageStats.cloudStorage)}
                            </Text>
                        </View>
                    </View>
                    <View style={[
                        styles.radio,
                        selectedStorage === 'cloud' && styles.radioSelected
                    ]} />
                </TouchableOpacity>

                {storageStats.lastSync && (
                    <Text style={styles.syncInfo}>
                        마지막 동기화: {new Date(storageStats.lastSync).toLocaleString()}
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
        padding: 16,
    },
    question: {
        fontSize: 16,
        marginBottom: 20,
        color: '#333',
        fontWeight: '500',
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
        marginBottom: 4,
    },
    storageInfo: {
        fontSize: 12,
        color: '#4A90E2',
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
    syncInfo: {
        textAlign: 'center',
        color: '#666',
        fontSize: 12,
        marginTop: 16,
    }
});

export default DataStorageScreen;