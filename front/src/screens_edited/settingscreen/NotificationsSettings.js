import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';

const NotificationsSettings = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <TouchableOpacity onPress={() => alert('저장 완료')}>
          <Text style={styles.doneButton}>완료</Text>
        </TouchableOpacity>
      </View>

      {/* 학습 섹션 */}
      <Text style={styles.sectionTitle}>학습</Text>
      <View style={styles.item}>
        <View>
          <Text style={styles.itemTitle}>목표 달성</Text>
          <Text style={styles.subItemText}>푸시 및 이메일</Text>
        </View>
        {/* Correct path for GoalAchievementNotification.js */}
        <TouchableOpacity onPress={() => router.push('/notifications/GoalAchievementNotification')}>
          <Text style={styles.editButton}>수정</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.item}>
        <View>
          <Text style={styles.itemTitle}>퀴즈</Text>
          <Text style={styles.subItemText}>푸시 및 이메일</Text>
        </View>
        {/* Correct path for QuizNotification.js */}
        <TouchableOpacity onPress={() => router.push('/notifications/QuizNotification')}>
          <Text style={styles.editButton}>수정</Text>
        </TouchableOpacity>
      </View>

      {/* 계정 섹션 */}
      <Text style={styles.sectionTitle}>계정</Text>
      <View style={styles.item}>
        <View>
          <Text style={styles.itemTitle}>보안</Text>
          <Text style={styles.subItemText}>푸시 및 이메일</Text>
        </View>
        {/* Correct path for SecurityNotification.js */}
        <TouchableOpacity onPress={() => router.push('/notifications/SecurityNotification')}>
          <Text style={styles.editButton}>수정</Text>
        </TouchableOpacity>
      </View>

      {/* Correct path for WeekdaySettings.js */}
      <View style={styles.item}>
        <View>
          <Text style={styles.itemTitle}>평일</Text>
          <Text style={styles.subItemText}>9:00 AM - 7:00 PM</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings/WeekdaySettings')}>
          <Text style={styles.editButton}>수정</Text>
        </TouchableOpacity>
      </View>

      {/* Correct path for WeekendSettings.js */}
      <View style={styles.item}>
        <View>
          <Text style={styles.itemTitle}>주말</Text>
          <Text style={styles.subItemText}>10:00 AM - 4:00 PM</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings/WeekendSettings')}>
          <Text style={styles.editButton}>수정</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  cancelButton: {
    fontSize: 16,
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  doneButton: {
    fontSize: 16,
    color: '#000',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#000',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemTitle: {
    fontSize: 16,
    color: '#000',
  },
  subItemText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  editButton: {
    fontSize: 16,
    color: '#007AFF',
  },
});

export default NotificationsSettings;