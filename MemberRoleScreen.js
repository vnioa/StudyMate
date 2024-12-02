//1. 초기 멤버 초대 페이지
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';

const MemberInviteScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const members = [
    { id: '1', name: '홍길동', image: '' },
    { id: '2', name: '김씨', image: '' },
  ];

  const toggleSelectMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((memberId) => memberId !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
          <Text style={styles.backButtonTextHeader}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>초기 멤버 초대</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="검색"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.memberItem}>
            <Image source={{ uri: item.image }} style={styles.memberImage} />
            <Text style={styles.memberName}>{item.name}</Text>
            <TouchableOpacity onPress={() => toggleSelectMember(item.id)}>
              <View style={styles.checkbox}>
                {selectedMembers.includes(item.id) && <View style={styles.checked} />}
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>멤버 추가</Text>
        </TouchableOpacity>
      </View>
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
  searchInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
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
});

export default MemberInviteScreen; 