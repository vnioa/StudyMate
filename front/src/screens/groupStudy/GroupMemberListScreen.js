import React, {useState, useCallback, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../../api/api';

const MemberItem = memo(({ member, onPress, isOnline }) => (
    <TouchableOpacity
        style={[
          styles.memberItem,
          !isOnline && styles.memberItemDisabled
        ]}
        onPress={() => onPress(member)}
        disabled={!isOnline}
    >
      <View style={styles.memberInfo}>
        <View style={styles.avatarContainer}>
          {member.avatar ? (
              <Image
                  source={{ uri: member.avatar }}
                  style={styles.avatar}
              />
          ) : (
              <Ionicons
                  name="person"
                  size={24}
                  color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
              />
          )}
          <View style={[
            styles.statusIndicator,
            { backgroundColor: member.isOnline ? theme.colors.success : theme.colors.inactive }
          ]} />
        </View>
        <View style={styles.memberDetails}>
          <Text style={[
            styles.memberName,
            !isOnline && styles.textDisabled
          ]}>
            {member.name}
          </Text>
          <Text style={[
            styles.memberRole,
            !isOnline && styles.textDisabled
          ]}>
            {member.role || '멤버'}
          </Text>
        </View>
      </View>
      <Ionicons
          name="chevron-forward"
          size={20}
          color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
      />
    </TouchableOpacity>
));

const GroupMemberListScreen = ({ navigation, route }) => {
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
  );

  const checkNetwork = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      setIsOnline(false);
      Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
      return false;
    }
    setIsOnline(true);
    return true;
  };

  const fetchMembers = useCallback(async () => {
    if (!(await checkNetwork())) {
      const cachedMembers = await AsyncStorage.getItem(`groupMembers_${groupId}`);
      if (cachedMembers) {
        setMembers(JSON.parse(cachedMembers));
      }
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/api/groups/${groupId}/members`);
      if (response.data.success) {
        setMembers(response.data.members);
        await AsyncStorage.setItem(
            `groupMembers_${groupId}`,
            JSON.stringify(response.data.members)
        );
      }
    } catch (error) {
      Alert.alert(
          '오류',
          error.response?.data?.message || '멤버 목록을 불러오는데 실패했습니다'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useFocusEffect(
      useCallback(() => {
        fetchMembers();
        const unsubscribe = NetInfo.addEventListener(state => {
          setIsOnline(state.isConnected);
        });
        return () => {
          unsubscribe();
          setMembers([]);
        };
      }, [fetchMembers])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMembers();
  }, [fetchMembers]);

  const handleMemberPress = useCallback((member) => {
    navigation.navigate('MemberProfile', {
      memberId: member.id,
      memberName: member.name
    });
  }, [navigation]);

  if (loading && !members.length) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>그룹 멤버 목록</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
            data={members}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <MemberItem
                    member={item}
                    onPress={handleMemberPress}
                    isOnline={isOnline}
                />
            )}
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                  enabled={isOnline}
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                멤버가 없습니다
              </Text>
            }
        />
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...Platform.select({
      ios: theme.shadows.small,
      android: { elevation: 2 }
    }),
  },
  headerTitle: {
    ...theme.typography.headlineSmall,
    color: theme.colors.text,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.medium,
    marginBottom: theme.spacing.sm,
    ...Platform.select({
      ios: theme.shadows.small,
      android: { elevation: 1 }
    }),
  },
  memberItemDisabled: {
    opacity: 0.5,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.background,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text,
    marginBottom: 2,
  },
  memberRole: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  emptyText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  textDisabled: {
    color: theme.colors.textDisabled,
  }
});

export default memo(GroupMemberListScreen);