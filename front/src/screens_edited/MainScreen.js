import { 
  View, 
  ScrollView, 
  TouchableOpacity,
  Text, 
  StyleSheet,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router'; 

const COLORS = {
  primary: '#4A90E2',
  secondary: '#FF6B6B',
  accent: '#FFD93D',
  success: '#6BCB77',
  background: '#F5F6FA',
};

const Header = () => {
  const router = useRouter(); 

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.push('/profile/MyProfileScreen')}>
        <Icon name="person-circle-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>
      <Icon name="book-outline" size={24} color={COLORS.primary} />
      <View style={styles.rightIcons}>
        <TouchableOpacity onPress={() => router.push('/notifications/NotificationsScreen')}>
          <Icon name="notifications-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/settings/SettingsScreen')}>
          <Icon name="settings-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StudySummaryCard = () => {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.circleProgress}>
        <Text style={styles.progressText}>75%</Text>
      </View>
      <View style={styles.studyInfo}>
        <Text style={styles.studyTimeText}>학습시간: 2시간 30분</Text>
        <View style={styles.streakContainer}>
          <Icon name="flame-outline" size={20} color={COLORS.accent} />
          <Text style={styles.streakText}>5일 연속 학습 중</Text>
        </View>
      </View>
    </View>
  );
};

const QuickAccessButtons = () => {
  const router = useRouter(); 

  const buttons = [
    { icon: 'book', label: '학습하기', screen: '/study' },
    { icon: 'people', label: '그룹스터디', screen: '/group-study' },
    { icon: 'chatbubbles', label: '채팅', screen: '/chat' },
    { icon: 'stats-chart', label: '통계', screen: '/statistics' },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAccess}>
      {buttons.map((button, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.quickButton}
          onPress={() => router.push(button.screen)} 
        >
          <Icon name={`${button.icon}-outline`} size={30} color={COLORS.primary} />
          <Text style={styles.quickButtonLabel}>{button.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const RecentActivities = () => {
  const activities = [
    { icon: 'book', content: '수학 학습 완료', time: '1시간 전' },
    { icon: 'people', content: '그룹 스터디 참여', time: '3시간 전' },
    { icon: 'chatbubbles', content: '질문 답변 완료', time: '어제' },
  ];

  return (
    <View>
      {activities.map((item, index) => (
        <View key={index} style={styles.activityItem}>
          <Icon name={item.icon} size={24} color={COLORS.primary} />
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>{item.content}</Text>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const MainScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header navigation={navigation} />
      <ScrollView>
        <StudySummaryCard />
        <QuickAccessButtons navigation={navigation} />
        <RecentActivities />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logo: {
    width: 120,
    height: 30,
  },
  rightIcons: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'space-between',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  circleProgress: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyInfo: {
    marginLeft: 16,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  studyTimeText: {
    fontSize: 16,
    marginBottom: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.accent,
  },
  quickAccess: {
    marginVertical: 16,
  },
  quickButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickButtonLabel: {
    marginTop: 4,
    fontSize: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityContent: {
    marginLeft: 16,
  },
  activityText: {
    fontSize: 16,
  },
  activityTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});

export default MainScreen;