import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function FindMentee() {
 const mentorData=[
{id:'1',name:'김철수',description:'수학 전문가로서 미적분과 기하학을 가르칩니다.'},
{id:'2',name:'이영희',description:'물리학과 화학 전공으로 과학 과목을 도와드립니다.'},
 ];
 const router=useRouter();
 return(
<View style ={styles.container}>
{/*뒤로가기 아이콘*/}
<TouchableOpacity onPress ={()=>router.back()}style ={styles.backButton}><Ionicons name="arrow-back" size={24} color="#000"/>
</TouchableOpacity>

{/*멘티 리스트*/}
<FlatList data ={mentorData}keyExtractor ={(item)=>item.id}renderItem={({item})=>(<View style ={styles.mentorItem}><Text style ={styles.mentorName}>{item.name}</Text><Text>{item.description}</Text></View>)}/>
</View>);}

const styles =StyleSheet.create({
container:{flex :1,padding :20},
backButton:{marginBottom :20},
mentorItem:{paddingVertical :15,borderBottomWidth :1,borderBottomColor:'#ddd'},
mentorName:{fontWeight :'bold'}
});