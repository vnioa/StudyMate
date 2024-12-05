import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { userAPI } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SocialAccountsScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [socialAccounts, setSocialAccounts] = useState([]);
    const [primaryAccount, setPrimaryAccount] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [accountsResponse, primaryResponse] = await Promise.all([
                userAPI.getSocialAccounts(),
                userAPI.getPrimaryAccount()
            ]);

            if (accountsResponse.data) {
                setSocialAccounts(accountsResponse.data);
                await AsyncStorage.setItem('socialAccounts', JSON.stringify(accountsResponse.data));
            }

            if (primaryResponse.data) {
                setPrimaryAccount(primaryResponse.data);
            }
        } catch (error) {
            Alert.alert('오류', '소셜 계정 정보를 불러오는데 실패했습니다.');
            // Fallback to cached data
            const cachedAccounts = await AsyncStorage.getItem('socialAccounts');
            if (cachedAccounts) {
                setSocialAccounts(JSON.parse(cachedAccounts));
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDisconnect = async (accountId, platform) => {
        if (socialAccounts.length === 1) {
            Alert.alert('알림', '최소 하나의 소셜 계정은 연결되어 있어야 합니다.');
            return;
        }

        Alert.alert(
            '계정 연동 해제',
            `${platform} 계정 연동을 해제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '해제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await userAPI.disconnectSocialAccount(accountId);
                            const newAccounts = socialAccounts.filter(account => account.id !== accountId);
                            setSocialAccounts(newAccounts);
                            await AsyncStorage.setItem('socialAccounts', JSON.stringify(newAccounts));
                            Alert.alert('성공', '계정 연동이 해제되었습니다.');
                        } catch (error) {
                            Alert.alert('오류', '계정 연동 해제에 실패했습니다.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSetPrimary = async (accountId) => {
        try {
            setLoading(true);
            const response = await userAPI.setPrimaryAccount(accountId);
            if (response.data.success) {
                setPrimaryAccount(accountId);
                Alert.alert('성공', '주 계정이 변경되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '주 계정 설정에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getPlatformIcon = (platform) => {
        const icons = {
            google: require('../../../../assets/google.png'),
            naver: require('../../../../assets/naver.jpg'),
            kakao: require('../../../../assets/kakao.png')
        };
        return icons[platform.toLowerCase()] || null;
    };

    if (loading && !socialAccounts.length) {
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
                <Text style={styles.headerTitle}>연동된 소셜 계정</Text>
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
                <Text style={styles.sectionTitle}>소셜 계정</Text>
                {socialAccounts.length > 0 ? (
                    socialAccounts.map((account) => (
                        <View key={account.id} style={styles.accountItem}>
                            <View style={styles.accountInfo}>
                                <Image
                                    source={getPlatformIcon(account.platform)}
                                    style={styles.platformIcon}
                                />
                                <View>
                                    <Text style={styles.email}>{account.email}</Text>
                                    <Text style={styles.platform}>
                                        {account.platform}
                                        {primaryAccount === account.id && ' (주 계정)'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.actionButtons}>
                                {primaryAccount !== account.id && (
                                    <TouchableOpacity
                                        style={styles.primaryButton}
                                        onPress={() => handleSetPrimary(account.id)}
                                        disabled={loading}
                                    >
                                        <Text style={styles.primaryText}>주 계정으로 설정</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={styles.disconnectButton}
                                    onPress={() => handleDisconnect(account.id, account.platform)}
                                    disabled={loading}
                                >
                                    <Text style={styles.disconnectText}>해제</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Icon name="link" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>연동된 소셜 계정이 없습니다.</Text>
                    </View>
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    accountItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    accountInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    platformIcon: {
        width: 32,
        height: 32,
        marginRight: 12,
        borderRadius: 16,
    },
    email: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
        color: '#333',
    },
    platform: {
        fontSize: 14,
        color: '#666',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    primaryButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#4A90E2',
    },
    primaryText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
    },
    disconnectButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    disconnectText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    }
});

export default SocialAccountsScreen;