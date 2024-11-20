import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Slider from '@react-native-community/slider'
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';

const ChangeFontSize = ({ setFontSize, currentFontSize = 1 }) => {
  const router = useRouter()
  const [size, setSize] = useState(currentFontSize);

  const handleSave = () => {
    setFontSize(size);
    router.back();
  };

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
        <Text style={styles.headerTitle}>글자 크기</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 글자 크기 슬라이더 */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sizeLabel}>가</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.8}
          maximumValue={1.4}
          value={size}
          onValueChange={setSize}
          minimumTrackTintColor="#4A90E2"
          maximumTrackTintColor="#000000"
          step={0.1}
        />
        <Text style={styles.sizeLabel}>가</Text>
      </View>

      {/* 미리보기 텍스트 */}
      <Text style={[styles.previewText, { fontSize: 16 * size }]}>
        글자 크기 미리보기
      </Text>
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#000',
  },
});

export default ChangeFontSize;