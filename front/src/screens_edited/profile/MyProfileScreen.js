import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import backgroundImage from '../../assets/images/splash-icon.png'
import profileImage from '../../assets/images/react-logo.png'
import Icon from '@expo/vector-icons/Ionicons';

const PersonalProfilePage = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="홈으로 돌아가기">
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 배경 이미지 */}
        <Image source={backgroundImage} style={styles.backgroundImage} />

        {/* 프로필 이미지 */}
        <View style={styles.profileImageContainer}>
          <Image source={profileImage} style={styles.profileImage} />
        </View>

        {/* 이미지 변경 버튼 */}
        <View style={styles.imageButtonsContainer}>
          <TouchableOpacity 
            style={styles.imageButton}
          >
            <Text style={styles.imageButtonText}>배경 변경</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.imageButton}
          >
            <Text style={styles.imageButtonText}>프로필 변경</Text>
          </TouchableOpacity>
        </View>

        {/* 프로필 정보 */}
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>홍길동</Text>
          <Text style={styles.userEmail}>hong@example.com</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: -50,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  imageButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  profileInfo: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
});

export default PersonalProfilePage;