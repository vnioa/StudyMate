import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/api';

const MemberInviteScreen = ({ navigation, route }) => {
  const { groupId } = route.params;
  const [search, setSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = useCallback(async (searchQuery = '') => {
    try {
      setLoading(true);
      const response = await api.get('/members/available', {
        params: {
          groupId,
          search: searchQuery
        }
      });
      setMembers(response.data.members);
    } catch (error) {
      Alert.alert(
          '오류',
          error.response?.data?.message || '멤버 목록을 불러오는데 실패했습니다'
      );
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useFocusEffect(
      useCallback(() => {
        fetchMembers();
        return () => {
          setMembers([]);
          setSelectedMembers([]);
        };
      }, [fetchMembers])
  );

  const handleSearch = useCallback(async () => {
    await fetchMembers(search);
  }, [search, fetchMembers]);

  const toggleSelectMember = useCallback((id) => {
    setSelectedMembers(prev =>
        prev.includes(id)
            ? prev.filter(memberId => memberId !== id)
            : [...prev, id]
    );
  }, []);

  const handleInviteMembers = async () => {
    if (selectedMembers.length === 0) {
      Alert.alert('알림', '초대할 멤버를 선택하세요.');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/groups/${groupId}/invite`, {
        memberIds: selectedMembers
      });

      Alert.alert('성공', '선택한 멤버가 초대되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            setSelectedMembers([]);
            fetchMembers();
          }
        }
      ]);
    } catch (error) {
      Alert.alert(
          '오류',
          error.response?.data?.message || '멤버 초대에 실패했습니다'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !members.length) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <View style={{ height: 30 }} />
        <View style={styles.header}>
          <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButtonHeader}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>초기 멤버 초대</Text>
        </View>

        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          </TouchableOpacity>
          <TextInput
              style={styles.searchInput}
              placeholder="이름으로 검색"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
          />
        </View>

        <Text style={styles.subTitle}>멤버를 선택하여 초대하세요</Text>

        <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.memberItem}
                    onPress={() => toggleSelectMember(item.id)}
                >
                  <Image
                      source={item.profileImage ? { uri: item.profileImage } : require('../../../assets/default-profile.png')}
                      style={styles.memberImage}
                  />
                  <Text style={styles.memberName}>{item.name}</Text>
                  <View style={[
                    styles.checkbox,
                    selectedMembers.includes(item.id) && styles.checkboxSelected
                  ]}>
                    {selectedMembers.includes(item.id) && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {search ? '검색 결과가 없습니다' : '초대 가능한 멤버가 없습니다'}
              </Text>
            }
        />

        <TouchableOpacity
            style={[
              styles.addButton,
              (selectedMembers.length === 0 || loading) && styles.addButtonDisabled
            ]}
            onPress={handleInviteMembers}
            disabled={selectedMembers.length === 0 || loading}
        >
          {loading ? (
              <ActivityIndicator color="#fff" />
          ) : (
              <Text style={styles.addButtonText}>
                {selectedMembers.length > 0
                    ? `${selectedMembers.length}명 초대하기`
                    : '멤버 초대'}
              </Text>
          )}
        </TouchableOpacity>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backButtonHeader: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
  },
  backButtonTextHeader: {
    fontSize: 30,
    color: '#000',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  memberImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    width: 14,
    height: 14,
    backgroundColor: '#007bff',
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
    fontSize: 16
  },
  checkboxSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff'
  },
  addButtonDisabled: {
    backgroundColor: '#ccc'
  }
});

export default MemberInviteScreen;