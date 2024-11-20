import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';

export default function LearningCommunityHome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>학습 커뮤니티</Text>

      {/* 실시간 Q&A */}
        <View>
            <Text style={styles.sectionTitle}>실시간 Q&A</Text>
                <View style={styles.qaItem}>
                    <Ionicons name="person-circle-outline" size={40} color="#6b6b6b" />
                    <View style={styles.qaContent}>
                    <Text style={styles.qaQuestion}>이 공식 어떻게 사용하나요?</Text>
                    <Text style={styles.qaTime}>5분 전</Text>
                    <Text>공식을 어떻게 적용해야 할지 잘 모르겠어요. 설명해주실 수 있으실까요??</Text>
              </View>
        </View>


        <Text style={styles.subSectionTitle}>노트 및 자료 공유</Text>
        <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => router.push('/personalstudy/learning-community/upload')} style={[styles.button, styles.blueButton]}>
          <Text style={styles.buttonText}>업로드하기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/personalstudy/learning-community/search')} style={[styles.button, styles.grayButton]}>
          <Text style={styles.buttonText}>검색하기</Text>
        </TouchableOpacity>
      </View>
        
      <Text style={styles.subSectionTitle}>멘토-멘티 매칭</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => router.push('/personalstudy/learning-community/find-mentor')} style={[styles.button, styles.blueButton]}>
          <Text style={styles.buttonText}>멘토 찾기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/personalstudy/learning-community/find-mentee')} style={[styles.button, styles.grayButton]}>
          <Text style={styles.buttonText}>멘티 찾기</Text>
        </TouchableOpacity>
      </View>

        <TouchableOpacity
          onPress={() => router.push('/personalstudy/learning-community/register')}
          style={[styles.button, styles.blueButton]}
        >
          <Text style={styles.buttonText}>멘토/멘티 등록</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerText: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center', 
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 15,
    },
    qaItem: {
      flexDirection: 'row',
      marginBottom: 20,
      alignItems: 'flex-start',
    },
    qaContent: {
      marginLeft: 10,
      flexShrink: 1,
    },
    qaQuestion: {
      fontWeight: 'bold',
      fontSize: 16,
      marginBottom: 5,
    },
    qaTime: {
      color: '#888',
      fontSize: 12,
      marginBottom: 5,
    },
    subSectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 10,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    button: {
      flexGrow: 1,
      paddingVertical: 12,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 5,
    },
    blueButton: {
      backgroundColor: '#007bff',
    },
    grayButton: {
      backgroundColor: '#e0e0e0',
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });