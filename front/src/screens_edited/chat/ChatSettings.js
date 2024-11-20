import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // 아이콘 사용

const ChatSettings = () => {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false); // 알림 설정 상태
  const toggleNotification = () => setIsNotificationEnabled(previousState => !previousState);

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅방 설정</Text>
      </View>

      {/* 채팅방 이름 */}
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>채팅방 이름</Text>
        <Text style={styles.settingValue}>영어스터디</Text>
      </View>

      {/* 채팅방 인원 */}
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>채팅방 인원</Text>
        <View style={styles.membersContainer}>
          <View style={styles.memberIcon}>
            <Text>김</Text>
          </View>
          <Icon name="add-circle-outline" size={24} color="#000" />
          <Text style={styles.memberCount}>+3</Text>
        </View>
      </View>

      {/* 사진 및 파일 */}
      <TouchableOpacity style={styles.settingItem}>
        <Text style={styles.settingLabel}>사진 및 파일</Text>
        <Icon name="chevron-forward-outline" size={24} color="#000" />
      </TouchableOpacity>

      {/* 사진 미리보기 */}
      <View style={styles.photoPreviewContainer}>
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <View key={index} style={styles.photoBox} />
        ))}
      </View>

      {/* 채팅방 알림 */}
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>채팅방 알림</Text>
        <Switch
          value={isNotificationEnabled}
          onValueChange={toggleNotification}
        />
      </View>

      {/* 채팅방 테마 */}
      <TouchableOpacity style={styles.settingItem}>
        <Text style={styles.settingLabel}>채팅방 테마</Text>
        <Text style={styles.settingValue}>라이트</Text>
      </TouchableOpacity>

      {/* 채팅 백업/복원 */}
      <TouchableOpacity style={styles.settingItem}>
        <Text style={styles.settingLabel}>채팅 백업/복원</Text>
        <Icon name="chevron-forward-outline" size={24} color="#000" />
      </TouchableOpacity>

      {/* 채팅방 암호화 */}
      <TouchableOpacity style={styles.settingItem}>
        <Text style={styles.settingLabel}>채팅방 암호화</Text>
        <Icon name="chevron-forward-outline" size={24} color="#000" />
      </TouchableOpacity>

      {/* 채팅방 공유 링크 생성 */}
      <TouchableOpacity style={styles.settingItem}>
        <Text style={styles.settingLabel}>채팅방 공유 링크 생성</Text>
        <Icon name="chevron-forward-outline" size={24} color="#000" />
      </TouchableOpacity>

      {/* 채팅방 나가기 */}
      <TouchableOpacity style={[styles.leaveButton]}>
        <Text style={[styles.leaveButtonText]}>채팅방 나가기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#888',
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberCount: {
    fontSize: 16,
    color: '#888',
    marginLeft: 10,
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  photoBox: {
    width: '15%',
    aspectRatio: 1,
    backgroundColor: '#eee',
    borderRadius: 5,
  },
  leaveButton:{
     marginTop :30 ,
     alignItems :'center'
   },

   leaveButtonText:{
     color :'red' ,
     fontSize :16 ,
     fontWeight :'bold'
   }
});

export default ChatSettings;