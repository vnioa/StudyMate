import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Switch 
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { useState } from 'react';

const DataBackupRestore = () => {
  const router = useRouter();
  const [autoBackup, setAutoBackup] = useState(false);

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
        <Text style={styles.headerTitle}>백업 및 복원</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 백업 섹션 */}
      <Text style={styles.sectionTitle}>백업</Text>
      
      {/* 자동 백업 설정 */}
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>자동 백업</Text>
        <Switch
          value={autoBackup}
          onValueChange={setAutoBackup}
          trackColor={{ false: '#767577', true: '#4A90E2' }}
          thumbColor="#fff"
        />
      </View>

      {/* 백업 버튼 */}
      <TouchableOpacity 
        style={[styles.button, styles.activeButton]}
        onPress={() => alert('백업을 시작합니다.')}
      >
        <Text style={styles.buttonText}>백업 시작</Text>
      </TouchableOpacity>

      {/* 마지막 백업 정보 */}
      <Text style={styles.lastBackupText}>
        마지막 백업: 2024-01-01 09:00
      </Text>

      {/* 복원 섹션 */}
      <Text style={styles.sectionTitle}>복원</Text>
      
      {/* 복원 버튼 */}
      <TouchableOpacity 
        style={[styles.button, styles.inactiveButton]}
        onPress={() => alert('복원을 시작합니다.')}
      >
        <Text style={[styles.buttonText, { color: '#666' }]}>복원</Text>
      </TouchableOpacity>

      {/* 주의사항 */}
      <View style={styles.warningContainer}>
        <Text style={styles.warningTitle}>주의사항</Text>
        <Text style={styles.warningText}>
          • 백업 진행 중에는 앱을 종료하지 마세요.
        </Text>
        <Text style={styles.warningText}>
          • 복원 시 기존 데이터가 삭제될 수 있습니다.
        </Text>
        <Text style={styles.warningText}>
          • 안정적인 네트워크 환경에서 진행해주세요.
        </Text>
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
    width: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 16,
  },
  button: {
    margin: 16,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#4A90E2',
  },
  inactiveButton: {
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastBackupText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningContainer: {
    padding: 16,
    margin: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FF6B6B',
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default DataBackupRestore;