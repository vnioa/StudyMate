import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/api';

const MemberManageScreen = ({ navigation, route }) => {
    const [loading, setLoading] = useState(true);
    const [menuOptions, setMenuOptions] = useState([]);
    const [error, setError] = useState(null);
    const { groupId } = route.params;

    const fetchMenuOptions = useCallback(async () => {
        try {
            setLoading(true);
            const [menuResponse, permissionResponse] = await Promise.all([
                axios.get('/api/member-management/menu-options'),
                axios.get(`/api/groups/${groupId}/permissions`)
            ]);

            const availableOptions = menuResponse.data.options.filter(option =>
                permissionResponse.data.permissions.includes(option.permission)
            );

            setMenuOptions(availableOptions);
        } catch (err) {
            setError('메뉴를 불러오는데 실패했습니다.');
            Alert.alert('오류', '메뉴를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchMenuOptions();
            return () => setMenuOptions([]);
        }, [fetchMenuOptions])
    );

    const handleOptionPress = useCallback((option) => {
        navigation.navigate(option.screen, {
            groupId,
            title: option.title
        });
    }, [navigation, groupId]);

    if (loading) {
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
                    style={styles.iconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>멤버 관리</Text>
                <TouchableOpacity
                    onPress={fetchMenuOptions}
                    style={styles.refreshButton}
                >
                    <Ionicons name="refresh" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : (
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {menuOptions.map((option, index) => (
                        <TouchableOpacity
                            key={option.id || index}
                            style={styles.optionItem}
                            onPress={() => handleOptionPress(option)}
                        >
                            <View style={styles.optionContent}>
                                <Ionicons
                                    name={option.icon || "people-outline"}
                                    size={24}
                                    color="#4A90E2"
                                    style={styles.optionIcon}
                                />
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionTitle}>
                                        {option.title}
                                    </Text>
                                    {option.description && (
                                        <Text style={styles.optionDescription}>
                                            {option.description}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color="#999"
                            />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    iconButton: {
        padding: 5,
    },
    refreshButton: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 15,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionIcon: {
        marginRight: 15,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    optionDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    errorText: {
        color: '#FF5252',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    }
});

export default MemberManageScreen;