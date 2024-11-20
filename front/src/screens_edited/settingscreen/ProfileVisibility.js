import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const ProfileVisibility = ({ setProfileVisibility }) => {
  const navigation = useNavigation();
  const [selectedVisibility, setSelectedVisibility] = useState('public');

  const handleVisibilityChange = (visibility) => {
    setSelectedVisibility(visibility);
    // 설정 페이지의 상태 업데이트
    setProfileVisibility(visibility);
  };

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>계정 공개 범위</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 설명 텍스트 */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>
          계정을 공개 또는 비공개로 설정할 수 있습니다.
        </Text>
        <Text style={styles.description}>
          공개 상태인 경우 모든 사람이 정보를 볼 수 있습니다.
        </Text>
        <Text style={styles.description}>
          비공개 상태인 경우 회원님의 승인한 사람들만 정보를 볼 수 있습니다.
        </Text>
      </View>

      {/* 공개 범위 선택 */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.optionItem}
        >
          <Text style={styles.optionText}>공개</Text>
          <View style={[
            styles.radioButton,
            styles.radioButtonSelected
          ]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionItem}
        >
          <Text style={styles.optionText}>비공개</Text>
          <View style={[
            styles.radioButton,
            styles.radioButtonSelected
          ]} />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  descriptionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  optionsContainer: {
    padding: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
  },
  radioButtonSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#4A90E2',
  },
});

export default ProfileVisibility;