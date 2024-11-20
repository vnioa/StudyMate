import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Upload() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 뒤로가기 아이콘 */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* 제목 입력 */}
      <TextInput placeholder="제목을 입력하세요" style={styles.input} />

      {/* 설명 입력 */}
      <TextInput placeholder="설명을 입력하세요" multiline numberOfLines={4} style={[styles.input, styles.textArea]} />

      {/* 파일 첨부하기 버튼 */}
      <TouchableOpacity onPress={() => {}} style={styles.fileButton}>
        <Text style={styles.buttonText}>파일 첨부하기</Text> 
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
   container:{
   flex :1,padding :20},
   backButton:{
   marginBottom :20},
   input:{
   borderWidth :1,borderColor:'#ddd',borderRadius :5,padding :10,marginBottom :15},
   textArea:{
   height :100,textAlignVertical :'top'},
   fileButton:{
   backgroundColor :'#007bff',paddingVertical :12,borderRadius :5,alignItems :'center'},
   buttonText:{
   color :'#fff',fontWeight :'bold'}
});