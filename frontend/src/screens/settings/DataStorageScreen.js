import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { storageAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DataStorageScreen = () => {
    const navigation = useNavigation();
    const [selectedStorage, setSelectedStorage] = useState('device');
    const [loading, setLoading] = useState(false);
    const [currentStorage, setCurrentStorage] = useState(null);

    useEffect(() => {
        fetchCurrentStorage();
    }, []);

    const fetchCurrentStorage = async () => {
        try {
            const storageType = await AsyncStorage.getItem('storageType');
            if (storageType) {
                setSelectedStorage(storageType);
                setCurrentStorage(storageType);
            }
        } catch (error) {
            Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
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
                            await storageAPI.changeStorageType(type);
                            await AsyncStorage.setItem('storageType', type);
                            setSelectedStorage(type);
                            setCurrentStorage(type);
                            Alert.alert('성공', '저장소가 변경되었습니다.');
                        } catch (error) {
                            Alert.alert('오류', error.response?.data?.message || '저장소 변경에 실패했습니다.');
                            setSelectedStorage(currentStorage);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
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
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
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
                        </View>
                    </View>
                    <View style={[
                        styles.radio,
                        selectedStorage === 'cloud' && styles.radioSelected
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    question: {
        fontSize: 16,
        marginBottom: 20,
        color: '#333',
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

export default DataStorageScreen;