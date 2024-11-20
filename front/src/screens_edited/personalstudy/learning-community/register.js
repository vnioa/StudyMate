import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Register() {
 const [name,setName]=useState('');
 const [description,setDescription]=useState('');
 const router=useRouter();
 return(
<View style ={styles.container}>
{/*뒤로가기 아이콘*/}
<TouchableOpacity onPress={()=>router.back()}style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#000"/></TouchableOpacity>

<TextInput placeholder="이름을 입력하세요"value={name}onChangeText={(text)=>setName(text)}style={styles.input}/>

<TextInput placeholder="설명을 입력하세요"value={description}onChange={(text)=>setDescription(text)}multiline numberOfLines={4}style={[styles.input ,styles.textArea]}/>

<TouchableOpacity onPress={()=>{}}style={styles.registerButton}><Text>등록</Text></TouchableOpacity></View>);}

const styles =StyleSheet.create({
container:{flex :1,padding :20},
backButton:{marginBottom :20},
input:{borderWidth :1,borderColor:'#ddd',borderRadius :5,paddingHorizontal :10,paddingVertical :8,fontSize :16,marginBottom :15},
textArea:{height :100,textAlignVertical :'top'},
registerButton:{backgroundColor :'#007bff',paddingVertical :12,borderRadius :5,textAlign :'center'}
});