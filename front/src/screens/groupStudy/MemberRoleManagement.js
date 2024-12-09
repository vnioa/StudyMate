import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/api';

const MemberRoleManagement = ({ navigation, route }) => {
  const { groupId } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/groups/${groupId}/members/roles`);
      setMembers(response.data.members);
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
        return () => setMembers([]);
      }, [fetchMembers])
  );

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await axios.put(`/api/groups/${groupId}/members/${memberId}/role`, {
        role: newRole
      });
      Alert.alert('성공', '멤버 역할이 변경되었습니다.');
      fetchMembers();
      setModalVisible(false);
    } catch (error) {
      Alert.alert(
          '오류',
          error.response?.data?.message || '역할 변경에 실패했습니다'
      );
    }
  };

  const renderRoleButton = (role) => (
      <TouchableOpacity
          style={[
            styles.roleButton,
            selectedMember?.role === role && styles.roleButtonSelected
          ]}
          onPress={() => handleRoleChange(selectedMember.id, role)}
      >
        <Text style={[
          styles.roleButtonText,
          selectedMember?.role === role && styles.roleButtonTextSelected
        ]}>
          {role}
        </Text>
      </TouchableOpacity>
  );

  if (loading && !members.length) {
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
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>멤버 역할 관리</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() => {
                      setSelectedMember(item);
                      setModalVisible(true);
                    }}
                >
                  <View style={styles.memberItem}>
                    <Image
                        source={item.profileImage ? { uri: item.profileImage } : require('../../../assets/study.png')}
                        style={styles.memberImage}
                    />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{item.name}</Text>
                      <Text style={styles.memberRole}>{item.role}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </View>
                </TouchableOpacity>
            )}
            refreshing={refreshing}
            onRefresh={fetchMembers}
            ListEmptyComponent={
              <Text style={styles.emptyText}>멤버가 없습니다</Text>
            }
        />

        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>역할 변경</Text>
                <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {selectedMember && (
                  <View style={styles.modalBody}>
                    <Image
                        source={selectedMember.profileImage ?
                            { uri: selectedMember.profileImage } :
                            require('../../../assets/study.png')
                        }
                        style={styles.modalImage}
                    />
                    <Text style={styles.modalName}>{selectedMember.name}</Text>
                    <View style={styles.roleButtons}>
                      {renderRoleButton('관리자')}
                      {renderRoleButton('멘토')}
                      {renderRoleButton('멤버')}
                    </View>
                  </View>
              )}
            </View>
          </View>
        </Modal>
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  modalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  roleButtonSelected: {
    backgroundColor: '#4A90E2',
  },
  roleButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  roleButtonTextSelected: {
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  }
});

export default MemberRoleManagement;