import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // 아이콘 사용

const FriendList = () => {
  const friends = [
    { id: '1', name: '김OO', status: '온라인' },
    { id: '2', name: '이OO', status: '온라인' },
    { id: '3', name: '박OO', status: '오프라인' },
    { id: '4', name: '최OO', status: '오프라인' },
    { id: '5', name: '정OO', status: '오프라인' },
  ];

  const favoriteFriends = [
    { id: '6', name: 'aaa', status: '온라인' },
    { id: '7', name: 'bbb', status: '온라인' },
    { id: '8', name: 'ccc', status: '오프라인' },
  ];

  const groups = [
    { id: '9', name: '고등학교' },
    { id: '10', name: '대학교' },
    { id: '11', name: '가족' },
  ];

  const blockedFriends = [
    { id: '12', name: 'OOO' },
  ];

  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendIcon} />
      <View>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendStatus}>{item.status}</Text>
      </View>
    </View>
  );

  const renderGroupItem = ({ item }) => (
    <View style={styles.groupItem}>
      <Icon name="people-outline" size={24} color="#000" />
      <Text style={styles.groupName}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => console.log('뒤로가기')}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>친구</Text>
      </View>

      {/* 검색 바 */}
      <View style={styles.searchBar}>
        <Icon name="search-outline" size={20} color="#888" />
        <TextInput placeholder="검색" style={styles.searchInput} />
      </View>

      {/* 친구 추가하기 */}
      <View style={styles.addFriendSection}>
        <TouchableOpacity style={styles.addFriendItem}>
          <Text>이메일로 추가</Text>
          <Icon name="chevron-forward-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addFriendItem}>
          <Text>QR코드로 추가</Text>
          <Icon name="chevron-forward-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 내 친구 */}
      <Text style={styles.sectionTitle}>내 친구</Text>
      <FlatList
        data={friends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />

      {/* 즐겨찾기한 친구 */}
      <Text style={styles.sectionTitle}>즐겨찾기한 친구</Text>
      <FlatList
        data={favoriteFriends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />

      {/* 그룹 */}
      <Text style={styles.sectionTitle}>그룹</Text>
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />

      {/* 차단 목록 */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>차단 목록</Text>
      <FlatList
        data={blockedFriends}
        renderItem={({ item }) => (
          <View style={[styles.friendItem, styles.blockedFriend]}>
            <View style={[styles.friendIcon]} />
            <Text>{item.name}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
  },
  searchInput: {
    marginLeft: 10,
    fontSize: 16,
    flexGrow: 1,
  },
  addFriendSection: {
    marginBottom: 20,
  },
  addFriendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendIcon:{
     width :40 ,
     height :40 ,
     borderRadius :20 ,
     backgroundColor :'#ccc' ,
     marginRight :10 
   },

   friendName:{
     fontSize :16 ,
     fontWeight :'bold'
   },

   friendStatus:{
     color :'#888'
   },

   groupItem:{
     flexDirection :'row' ,
     alignItems :'center' ,
     paddingVertical :10 ,
     borderBottomWidth :1 ,
     borderBottomColor :'#eee'
   },

   groupName:{
     marginLeft :10 ,
     fontSize :16 
   },

   blockedFriend:{
     backgroundColor :'#f8f8f8'
   }
});

export default FriendList;