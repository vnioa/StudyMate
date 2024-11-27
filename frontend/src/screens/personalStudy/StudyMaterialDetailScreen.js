import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    Share,
    Linking,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Markdown from 'react-native-markdown-display';
import useCollapse from 'react-collapsed';
import { materialAPI } from '../../services/api';

const StudyMaterialDetailScreen = ({ navigation, route }) => {
    const { materialId } = route.params;
    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchMaterialDetail();
    }, [materialId]);

    const fetchMaterialDetail = async () => {
        try {
            setLoading(true);
            const response = await materialAPI.getMaterialDetail(materialId);
            if (response.data) {
                setMaterial(response.data);
            }
        } catch (error) {
            Alert.alert('오류', '자료를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                title: material.title,
                message: `${material.title}\n\n${material.description}`
            });
        } catch (error) {
            Alert.alert('오류', '공유하는데 실패했습니다');
        }
    };

    const handleDownload = async () => {
        try {
            const supported = await Linking.canOpenURL(material.downloadUrl);
            if (supported) {
                await Linking.openURL(material.downloadUrl);
            } else {
                Alert.alert('오류', '다운로드 링크를 열 수 없습니다');
            }
        } catch (error) {
            Alert.alert('오류', '다운로드에 실패했습니다');
        }
    };

    const CollapsibleSection = ({ title, children }) => {
        const { getCollapseProps, getToggleProps, isExpanded } = useCollapse();

        return (
            <View style={styles.section}>
                <Pressable
                    {...getToggleProps()}
                    style={styles.sectionHeader}
                >
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <Icon
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#666"
                    />
                </Pressable>
                <View {...getCollapseProps()}>
                    {children}
                </View>
            </View>
        );
    };

    if (loading || !material) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>학습 자료</Text>
                <Pressable
                    style={styles.moreButton}
                    onPress={handleShare}
                >
                    <Icon name="share-2" size={24} color="#333" />
                </Pressable>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchMaterialDetail}
                        colors={['#4A90E2']}
                    />
                }
            >
                <View style={styles.titleSection}>
                    <Text style={styles.title}>{material.title}</Text>
                    <Text style={styles.description}>{material.description}</Text>
                    <View style={styles.authorInfo}>
                        <Text style={styles.author}>{material.author}</Text>
                        <Text style={styles.metaText}>•</Text>
                        <Text style={styles.metaText}>
                            {new Date(material.lastModified).toLocaleDateString()}
                        </Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tagContainer}
                    >
                        {material.tags.map(tag => (
                            <Pressable
                                key={tag}
                                style={styles.tag}
                                onPress={() => navigation.navigate('TaggedMaterials', { tag })}
                            >
                                <Text style={styles.tagText}>#{tag}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                <CollapsibleSection title="학습 내용">
                    <View style={styles.contentSection}>
                        <Markdown style={markdownStyles}>
                            {material.content}
                        </Markdown>
                    </View>
                </CollapsibleSection>

                {material.references && (
                    <CollapsibleSection title="참고 자료">
                        <View style={styles.contentSection}>
                            <Markdown style={markdownStyles}>
                                {material.references}
                            </Markdown>
                        </View>
                    </CollapsibleSection>
                )}
            </ScrollView>

            <View style={styles.bottomBar}>
                <Pressable
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('EditMaterial', { materialId })}
                >
                    <Icon name="edit-2" size={20} color="#4A90E2" />
                    <Text style={styles.actionButtonText}>수정</Text>
                </Pressable>
                <Pressable
                    style={styles.actionButton}
                    onPress={handleShare}
                >
                    <Icon name="share-2" size={20} color="#4A90E2" />
                    <Text style={styles.actionButtonText}>공유</Text>
                </Pressable>
                <Pressable
                    style={styles.actionButton}
                    onPress={handleDownload}
                >
                    <Icon name="download" size={20} color="#4A90E2" />
                    <Text style={styles.actionButtonText}>다운로드</Text>
                </Pressable>
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
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
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
    titleSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
        lineHeight: 22,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    author: {
        fontSize: 14,
        fontWeight: '500',
    },
    metaText: {
        color: '#666',
        fontSize: 14,
    },
    tagContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    tag: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginRight: 8,
    },
    tagText: {
        color: '#666',
        fontSize: 14,
    },
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    contentSection: {
        padding: 16,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
    },
    actionButtonText: {
        color: '#4A90E2',
        fontSize: 16,
        fontWeight: '500',
    },
});

const markdownStyles = {
    body: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
    heading1: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 16,
    },
    heading2: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 12,
    },
    paragraph: {
        marginVertical: 8,
    },
    listItem: {
        marginVertical: 4,
    },
};

export default StudyMaterialDetailScreen;