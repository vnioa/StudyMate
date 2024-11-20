import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView 
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
const EditProfileInfo
 = () => {
  const router = useRouter()
  
  // 초기 상태 설정
  const [userInfo, setUserInfo] = useState({
    name: '김OO',
    phone: '010-XXXX-XXXX',
    birthDate: '2024-01-01',
    id: 'abc123', 
    email: 'abc123@gmail.com', 
    password: 'abc123',
    confirmPassword: 'abc123'
  });

  const handleChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        {/* 이름 */}
        <Text style={styles.label}>이름</Text>
        <TextInput
          style={styles.input}
          value={userInfo.name}
          onChangeText={(text) => handleChange('name', text)}
        />

        {/* 전화번호 */}
        <Text style={styles.label}>전화번호</Text>
        <TextInput
          style={styles.input}
          value={userInfo.phone}
          onChangeText={(text) => handleChange('phone', text)}
          keyboardType="phone-pad"
        />

        {/* 생년월일 */}
        <Text style={styles.label}>생년월일</Text>
        <TextInput
          style={styles.input}
          value={userInfo.birthDate}
          onChangeText={(text) => handleChange('birthDate', text)}
        />

        {/* 아이디 (읽기 전용) */}
        <Text style={styles.label}>아이디</Text>
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          value={userInfo.id}
          editable={false}
        />

        {/* 이메일 (읽기 전용) */}
        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          value={userInfo.email}
          editable={false}
        />

        {/* 비밀번호 */}
        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={userInfo.password}
          onChangeText={(text) => handleChange('password', text)}
          secureTextEntry
        />

        {/* 비밀번호 재입력 */}
        <Text style={styles.label}>비밀번호 재입력</Text>
        <TextInput
          style={styles.input}
          value={userInfo.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
          secureTextEntry
        />

        {/* 변경 버튼 */}
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={() => {
            router.back();
          }}
        >
          <Text style={styles.submitButtonText}>변경</Text>
        </TouchableOpacity>
      </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfileInfo