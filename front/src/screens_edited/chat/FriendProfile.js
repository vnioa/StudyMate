import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // 아이콘 사용

const FriendProfile = () => {
  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => console.log('뒤로가기')}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필</Text>
      </View>

      {/* 프로필 이미지 및 정보 */}
      <View style={styles.profileContainer}>
        <View style={styles.profileImage} />
        <Text style={styles.profileName}>김OO</Text>
        <Text style={styles.profileDetails}>남자, 24세, 전산사</Text>
        <Text style={styles.profileDetails}>OO대학교</Text>
      </View>

      {/* 기능 버튼들 */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionItem}>
          <Text>1:1 채팅하기</Text>
          <Icon name="chatbubble-outline" size={24} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Text>음성 통화하기</Text>
          <Icon name="call-outline" size={24} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Text>화상 통화하기</Text>
          <Icon name="videocam-outline" size={24} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Text>차단하기</Text>
          <Icon name="close-outline" size={24} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Text>삭제하기</Text>
          <Icon name="person-remove-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 공유한 파일 섹션 */}
      <Text style={styles.sectionTitle}>공유한 파일</Text>
      <View style={styles.sharedFilesContainer}>
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <View key={index} style={styles.fileBox} />
        ))}
      </View>

      {/* 나와 같이 있는 그룹 섹션 */}
      <Text style={[styles.sectionTitle]}>나와 같이 있는 그룹</Text>
      <View style={styles.groupsContainer}>
        <View style={styles.groupItem}>
          <View style={[styles.groupImage]} />
          <View>
            <Text>영어스터디</Text>
            <Text>멤버 3명</Text>
          </View>
        </View>

        <View style={styles.groupItem}>
          <View style={[styles.groupImage]} />
          <View>
            <Text>수학스터디</Text>
            <Text>멤버 3명</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileDetails: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  actionsContainer: {
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle:{
     fontSize :16 ,
     fontWeight :'bold' ,
     marginVertical :15 
   },

   sharedFilesContainer:{
     flexDirection :'row' ,
     justifyContent :'space-between'
   },

   fileBox:{
     width :'15%' ,
     aspectRatio :1 ,
     backgroundColor :'#eee' ,
     borderRadius :5 
   },

   groupsContainer:{
     marginTop :10 
   },

   groupItem:{
     flexDirection :'row' ,
     alignItems :'center' ,
     paddingVertical :10 
   },

   groupImage:{
     width :40 ,
     height :40 ,
     borderRadius :20 ,
     backgroundColor :'#ccc' ,
     marginRight :10 
   }
});

export default FriendProfile;