import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';

const LinkedSocialAccounts = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>연동된 소셜 계정</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 소셜 계정 목록 */}
      <View style={styles.accountsList}>
        {/* 구글 계정 */}
        <View style={styles.accountItem}>
          <View style={styles.accountInfo}>
            <Image 
              // source={require('../../assets/images/icon.png')} 
              style={styles.socialIcon}
            />
            <View style={styles.accountTextContainer}>
              <Text style={styles.accountType}>구글</Text>
              <Text style={styles.accountEmail}>abc123@gmail.com</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.unlinkButton}
            onPress={() => alert('구글 계정 연동이 해제되었습니다.')}
          >
            <Text style={styles.unlinkButtonText}>해지</Text>
          </TouchableOpacity>
        </View>

        {/* 네이버 계정 */}
        <View style={styles.accountItem}>
          <View style={styles.accountInfo}>
            <Image 
              // source={require('../../assets/images/icon.png')} 
              style={styles.socialIcon}
            />
            <View style={styles.accountTextContainer}>
              <Text style={styles.accountType}>네이버</Text>
              <Text style={styles.accountEmail}>abc123@naver.com</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.unlinkButton}
            onPress={() => alert('네이버 계정 연동이 해제되었습니다.')}
          >
            <Text style={styles.unlinkButtonText}>해지</Text>
          </TouchableOpacity>
        </View>

        {/* 카카오 계정 */}
        <View style={styles.accountItem}>
          <View style={styles.accountInfo}>
            <Image 
              // source={require('../../assets/images/icon.png')} 
              style={styles.socialIcon}
            />
            <View style={styles.accountTextContainer}>
              <Text style={styles.accountType}>카카오</Text>
              <Text style={styles.accountEmail}>abc123@kakao.com</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.unlinkButton}
            onPress={() => alert('카카오 계정 연동이 해제되었습니다.')}
          >
            <Text style={styles.unlinkButtonText}>해지</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40, // 뒤로가기 버튼과 균형을 맞추기 위한 빈 공간
  },
  accountsList: {
    padding: 16,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  accountTextContainer: {
    justifyContent: 'center',
  },
  accountType: {
    fontSize: 14,
    color: '#666',
  },
  accountEmail: {
    fontSize: 16,
    color: '#000',
  },
  unlinkButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  unlinkButtonText: {
    fontSize: 14,
    color: '#666',
  },
});

export default LinkedSocialAccounts;