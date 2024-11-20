import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';

const DataBackupRestore = () => {
  const router = useRouter()
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
        <Text style={styles.headerTitle}>데이터 저장</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 질문 텍스트 */}
      <Text style={styles.questionText}>어디에 데이터를 저장할까요?</Text>

      {/* 옵션 선택 */}
      <TouchableOpacity 
        style={styles.optionItem}
      >
        <Text style={styles.optionText}>기기에 저장</Text>
        <View style={[
          styles.radioButton,
          styles.radioButtonSelected
        ]} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionItem}
      >
        <Text style={styles.optionText}>클라우드에 저장</Text>
        <View style={[
          styles.radioButton,
          styles.radioButtonSelected
        ]} />
      </TouchableOpacity>
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
  questionText: {
    fontSize: 16,
    padding: 16,
    color: '#000',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
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

export default DataBackupRestore;