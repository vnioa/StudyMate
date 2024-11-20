import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';

const SelectLanguage = () => {
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
        <Text style={styles.headerTitle}>언어</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 언어 선택 옵션 */}
      <TouchableOpacity 
        style={styles.optionItem}
        onPress={() => handleLanguageSelect('ko')}
      >
        <Text style={styles.optionText}>한국어</Text>
        <View style={[
          styles.radioButton,
          styles.radioButtonSelected
        ]} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionItem}
        onPress={() => handleLanguageSelect('en')}
      >
        <Text style={styles.optionText}>영어</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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

export default SelectLanguage;