import React, { useState } from 'react';
import { View, TextInput, Button, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function AddMaterial() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(''); // 카테고리 텍스트 입력 상태 추가
  
  const router = useRouter(); // Expo Router 사용

  return (
    <View style={styles.container}>
      {/* 제목 입력 */}
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="자료 이름"
        style={styles.input}
      />

      {/* 카테고리 텍스트 입력 */}
      <TextInput
        value={category}
        onChangeText={setCategory}
        placeholder="카테고리"
        style={styles.input}
      />

      {/* 파일 첨부 버튼 */}
      <TouchableOpacity style={styles.fileButton}>
        <Text style={styles.fileButtonText}>파일 첨부</Text>
      </TouchableOpacity>

      {/* 저장 버튼 */}
      <Button title="저장" onPress={() => {
        console.log('자료 저장:', title);
        console.log('카테고리:', category);
        router.back(); // 저장 후 이전 화면으로 돌아가기
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
 container:{
paddingHorizontal :20 ,paddingVertical :30 ,backgroundColor:'#fff',flexGrow:1},

input:{
borderWidth :1 ,borderColor:'#e0e0e0',borderRadius:5,paddingVertical:10,paddingHorizontal:15,fontSize:16 ,marginBottom:20},

fileButton:{backgroundColor:'#4A90E2',paddingVertical:15,borderRadius:5 ,alignItems:'center'},
fileButtonText:{color:'#fff',fontWeight:'bold'}
});