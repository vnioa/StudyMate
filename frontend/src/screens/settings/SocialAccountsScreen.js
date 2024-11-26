import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { userAPI } from '../../services/api';

const SocialAccountsScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [socialAccounts, setSocialAccounts] = useState([]);

    useEffect(() => {
        fetchSocialAccounts();
    }, []);

    const fetchSocialAccounts = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getSocialAccounts();
            setSocialAccounts(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '소셜 계정 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async (accountId, platform) => {
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
                            setSocialAccounts(prev =>
                                prev.filter(account => account.id !== accountId)
                            );
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

    const getPlatformIcon = (platform) => {
        switch(platform.toLowerCase()) {
            case 'google':
                return require('../../../assets/images/google-icon.png');
            case '네이버':
                return require('../../../assets/images/naver-icon.png');
            case '카카오':
                return require('../../../assets/images/kakao-icon.png');
            default:
                return null;
        }
    };

    if (loading && !socialAccounts.length) {
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
                <Text style={styles.headerTitle}>연동된 소셜 계정</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
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
                                    <Text style={styles.platform}>{account.platform}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.disconnectButton}
                                onPress={() => handleDisconnect(account.id, account.platform)}
                                disabled={loading}
                            >
                                <Text style={styles.disconnectText}>해제</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>연동된 소셜 계정이 없습니다.</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
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
        fontSize: 18,
        fontWeight: 'bold',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    accountInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    platformIcon: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    email: {
        fontSize: 16,
        marginBottom: 4,
        color: '#333',
    },
    platform: {
        fontSize: 14,
        color: '#666',
    },
    disconnectButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
    },
    disconnectText: {
        fontSize: 14,
        color: '#666',
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 30,
    }
});

export default SocialAccountsScreen;