import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const ScreenMode = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>화면 모드</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 모드 선택 */}
      <TouchableOpacity 
        style={styles.optionItem}
      >
        <Text style={styles.optionText}>라이트 모드</Text>
        <View style={[
          styles.radioButton,
          styles.radioButtonSelected
        ]} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionItem}
      >
        <Text style={styles.optionText}>다크 모드</Text>
        <View style={[
          styles.radioButton,
          // styles.radioButtonSelected
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

export default ScreenMode;