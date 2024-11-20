import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // 아이콘 사용을 위한 라이브러리

const ChatRoom = () => {
  const [selectedMessage, setSelectedMessage] = useState(null); // 선택된 메시지
  const [modalVisible, setModalVisible] = useState(false); // 메시지 팝업 모달 상태
  const [showOptions, setShowOptions] = useState(false); // 파일, 사진 등 옵션 표시 상태

  const messages = [
    { id: '1', user: '김OO', text: 'ㅎㅇ' },
    { id: '2', user: '이OO', text: '하이요' },
    { id: '3', user: '최OO', text: '안녕하세요' },
  ];

  const openMessageMenu = (message) => {
    setSelectedMessage(message);
    setModalVisible(true);
  };

  const closeMessageMenu = () => {
    setModalVisible(false);
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => console.log('뒤로가기')}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>채팅방</Text>
        <View style={styles.headerIcons}>
          <Icon name="search" size={24} color="#000" />
          <Icon name="settings-outline" size={24} color="#000" style={{ marginLeft: 15 }} />
        </View>
      </View>

      {/* 검색 바 */}
      <View style={styles.searchBar}>
        <Text>🔍 검색</Text>
      </View>

      {/* 채팅 메시지 목록 */}
      <View style={styles.chatContainer}>
        {messages.map((message) => (
          <TouchableOpacity key={message.id} onPress={() => openMessageMenu(message)} style={styles.messageContainer}>
            <Text style={styles.messageUser}>{message.user}</Text>
            <Text style={styles.messageText}>{message.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 메시지 팝업 메뉴 */}
      {selectedMessage && (
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeMessageMenu}
        >
          <TouchableOpacity style={styles.modalOverlay} onPress={closeMessageMenu}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.menuItem}>
                <Text>답장</Text>
                <Icon name="return-up-back" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text>전달</Text>
                <Icon name="paper-plane-outline" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text>삭제</Text>
                <Icon name="trash-outline" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Text>편집</Text>
                <Icon name="pencil-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* 입력 및 옵션 버튼 */}
      {showOptions && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton}>
            <Icon name="document-outline" size={24} color="#000" />
            <Text>파일</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton}>
            <Icon name="image-outline" size={24} color="#000" />
            <Text>사진</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton}>
            <Icon name="mic-outline" size={24} color="#000" />
            <Text>음성</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton}>
            <Icon name="stats-chart-outline" size={24} color="#000" />
            <Text>투표</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 텍스트 입력 및 + 버튼 */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={toggleOptions} style={[styles.plusButton, showOptions && styles.plusButtonActive]}>
          <Icon name="add-circle-outline" size={30} color="#007bff" />
        </TouchableOpacity>

        {/* 텍스트 입력 칸 */}
        <TextInput
          placeholder="입력하세요"
          style={styles.textInput}
        />

        {/* 전송 버튼 */}
        <TouchableOpacity style={[styles.sendButton]}>
          <Icon name="send-outline" size={30} color="#007bff" />
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  searchBar: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    marginHorizontal: 10,
    marginVertical: 10,
  },
  chatContainer: {
    flexGrow: 1,
    paddingHorizontal: 10,
  },
  messageContainer: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  messageUser: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageText: {
    marginTop: 5,
    color: '#555',
  },
  
   modalOverlay:{
     flex :1 ,
     justifyContent:'center',
     alignItems:'center'
   },

   modalContent:{
     width:'80%',
     backgroundColor:'#fff',
     borderRadius :10 ,
     padding :20 ,
     alignItems :'flex-start'
   },

   menuItem:{
     flexDirection:'row',
     justifyContent:'space-between',
     width :'100%',
     paddingVertical :10 ,
     borderBottomWidth :1 ,
     borderBottomColor:'#eee'
   },

   optionsContainer:{
     flexDirection :'row' ,
     justifyContent:'space-around',
     paddingVertical :10 ,
     backgroundColor:'#f0f0f0'
   },

   optionButton:{
     alignItems:'center'
   },

   inputContainer:{
       flexDirection :'row' ,
       alignItems :'center' ,
       paddingVertical :10 ,
       paddingHorizontal :15 ,
       borderTopWidth :1 ,
       borderTopColor:'#eee'
   },

   plusButtonActive:{
       transform:[{rotate :'45deg'}]
   },

   textInput:{
       flexGrow :1 ,
       backgroundColor:'#f0f0f0' ,
       borderRadius :20 ,
       paddingHorizontal :15 ,
       marginHorizontal :10 
   },

   sendButton:{},
});

export default ChatRoom;     