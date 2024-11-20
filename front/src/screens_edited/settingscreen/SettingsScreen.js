import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';

const SettingsScreen = () => {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="뒤로가기">
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <View style={styles.section}>
      <TouchableOpacity style={styles.item} onPress={() => router.push('/settings/NotificationsSettings')}>
          <Text style={styles.itemText}>알림</Text>
          <Icon name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>계정</Text>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/settings/EditProfileInfo')}>
          <Text style={styles.itemText}>정보 수정</Text>
          <Icon name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/settings/LinkedSocialAccounts')}>
          <Text style={styles.itemText}>연동된 소셜 계정</Text>
          <Icon name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>개인정보 및 데이터</Text>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/settings/ProfileVisibility')}
        >
          <View>
            <Text style={styles.settingLabel}>프로필 공개 범위</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.valueText}>공개</Text>
            <Icon name="chevron-forward" size={20} color="#666" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => router.push('/settings/DataBackupRestore')}>
          <Text style={styles.itemText}>데이터 백업 및 복원</Text>
          <Icon name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/settings/DataStorageLocation')}>
          <Text style={styles.itemText}>데이터 저장 위치 선택</Text>
          <Icon name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>접근성</Text>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/settings/ScreenMode')}>
          <Text style={styles.itemText}>화면 모드</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>라이트 모드</Text>
            <Icon name="chevron-forward" size={20} color="#000" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/settings/SelectLanguage')}>
          <Text style={styles.itemText}>언어</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>한국어</Text>
            <Icon name="chevron-forward" size={20} color="#000" />
          </View>
        </TouchableOpacity>
        <View style={[styles.item, styles.noArrow]}>
          <Text style={styles.itemText}>고대비 모드</Text>
          <Switch
            value={false}
            trackColor={{ false: '#767577', true: '#4A90E2' }}
            thumbColor={'#f4f3f4'}
          />
        </View>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/settings/ChangeFontSize')}>
          <Text style={styles.itemText}>글자 크기</Text>
          <Icon name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>

        <View style={{ marginTop: 30 }}>
          <TouchableOpacity 
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deleteAccountButton}
            onPress={() => router.push('/settings/DeleteAccount')}
          >
            <Text style={[styles.deleteAccountText, { color: '#FF6B6B' }]}>계정 삭제</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#666',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemText: {
    fontSize: 16,
    color: '#000',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  noArrow: {
    justifyContent: 'space-between',
  },
  logoutButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#000',
  },
  deleteAccountButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  deleteAccountText: {
    fontSize: 16,
  },
});

export default SettingsScreen;