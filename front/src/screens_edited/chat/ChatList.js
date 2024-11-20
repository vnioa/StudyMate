import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'

const ChatList = () => {
  const [selectedChat, setSelectedChat] = useState(null); // 선택된 채팅방
  const [modalVisible, setModalVisible] = useState(false); // 모달 상태
  const [searchText, setSearchText] = useState('')

  const chats = [
    { id: '1', name: '김OO', lastMessage: 'ㅎㅇ', time: '7:30 PM' },
    { id: '2', name: '박OO', lastMessage: 'ㅎㅇ', time: '어제' },
    { id: '3', name: '최OO', lastMessage: 'ㅎㅇ', time: '4일 전' },
  ];

  const filteredChats = chats.filter(chat =>
    chat.name.includes(searchText)
  );
  
  const openMenu = (chat) => {
    setSelectedChat(chat);
    setModalVisible(true);
  };

  const closeMenu = () => {
    setModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onLongPress={() => openMenu(item)} style={styles.chatItem}>
      <View style={styles.leftSection}>
        <View style={styles.profileImage} />
        <Text style={styles.chatName}>{item.name}</Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <Text style={styles.header}>채팅</Text>

      {/* 검색 바 */}
      <View style={styles.searchBar}>
        <Icon name="search-outline" size={20} color="#888" />
            <TextInput
            placeholder="검색"
            value={searchText}
            onChangeText={(text) => setSearchText(text)} 
            style={styles.searchInput}
            />
      </View>

      {/* 채팅 목록 */}
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      {/* 모달 - 알림 끄기 및 핀 설정 */}
      {selectedChat && (
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeMenu}
        >
          <TouchableOpacity style={styles.modalOverlay} onPress={closeMenu}>
            <View style={styles.modalContent}>
              <Text>{selectedChat.name}</Text>
              <TouchableOpacity style={styles.menuItem}>
                <Text>알림 끄기</Text>
                <Icon name="notifications-off-outline" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text>핀 설정</Text>
                <Icon name="pin-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* 채팅 추가 버튼 */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>💬</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingHorizontal: 10,
    },
    header: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: 15,
    },
    searchBar: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 5,
      marginBottom: 10,
    },
    searchInput: {
        marginLeft: 10,
        fontSize: 16,
        flexGrow: 1,
      },
    chatItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    leftSection:{
        flexDirection:'row', // 프로필 이미지와 이름을 가로로 배치
        alignItems:'center'
      },
    rightSection:{
        flexDirection:'row',
        alignItems:'flex-end' // 오른쪽 정렬
    },

    profileImage:{
        width :40 ,
        height :40 ,
        borderRadius :20 ,
        backgroundColor :'#ccc' , 
        marginRight :10 
      },
   
    chatInfo: {
      flexDirection: 'column',
    },
    chatName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    lastMessage: {
      color: '#888',
      marginRight :15 
    },
    time: {
      color: '#888',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '80%',
      backgroundColor: '#fff',
      borderRadius: 10,
      paddingHorizontal: 20,
      paddingVertical: 15,
      alignItems: 'flex-start',
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    addButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: '#007bff',
      width: 60,
      height: 60,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonText: {
      color: '#fff',
      fontSize: 30,
    }
});
export default ChatList