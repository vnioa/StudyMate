
//VB
//멥버 역할 부여 및 관리 권한
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';

const MemberRoleScreen = () => {
  const members = [
    { id: '1', name: '김씨', role: '관리자', image: '' },
    { id: '2', name: '박씨', role: '멤버', image: '' },
    { id: '3', name: '이OO', role: '멤버', image: '' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>멤버 역할 부여 및 관리 권한</Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.memberItem}>
            <Image source={{ uri: item.image }} style={styles.memberImage} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.name}</Text>
              <Text style={styles.memberRole}>{item.role}</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
  },
  memberRole: {
    color: '#888',
  },
  arrow: {
    fontSize: 18,
    color: '#888',
  },
});

export default MemberRoleScreen;