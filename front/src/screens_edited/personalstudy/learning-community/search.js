import { View, TextInput, TouchableOpacity, Text, FlatList, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Search() {
 const [searchQuery,setSearchQuery]=useState('');
 const [dataList]=useState([
 {id :'1',title:'미적분 공식 정리',description :'미적분 공식을 정리한 자료입니다.'},
 {id :'2',title:'확률과 통계 요약',description :'확률과 통계 요약 노트입니다.'},
 ]);
 const filteredData=dataList.filter(item=>item.title.toLowerCase().includes(searchQuery.toLowerCase()));
 const router=useRouter();
 return(
<View style ={styles.container}>
{/*뒤로가기 아이콘*/}
<TouchableOpacity onPress ={()=>router.back()}style ={styles.backButton}><Ionicons name="arrow-back" size={24} color="#000"/></TouchableOpacity>

{/*검색 입력창*/}
<TextInput placeholder ="자료를 검색하세요"value ={searchQuery}onChangeText ={(text)=>setSearchQuery(text)}style ={styles.searchInput}/>

{/*자료 리스트*/}
<FlatList data ={filteredData}keyExtractor ={(item)=>item.id}renderItem ={({item})=>(<View style ={styles.listItem}><Text style ={styles.itemTitle}>{item.title}</Text><Text>{item.description}</Text></View>)}/>

{/*검색 버튼*/}
<TouchableOpacity onPress ={()=>{}}style ={[styles.searchButton]}><Text>검색</Text></TouchableOpacity></View>);}

const styles =StyleSheet.create({
container:{flex :1,padding :20},
backButton:{marginBottom :20},
searchInput:{borderWidth :1,borderColor:'#ddd',borderRadius :5,padding :10,marginBottom :15},
listItem:{paddingVertical :15,borderBottomWidth :1,borderBottomColor:'#ddd'},
itemTitle:{fontWeight :'bold'},
searchButton:{backgroundColor :'#007bff',paddingVertical :12,borderRadius :5,textAlign :'center'}
});