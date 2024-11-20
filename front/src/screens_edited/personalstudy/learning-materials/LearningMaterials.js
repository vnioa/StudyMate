import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const data = [
  { id: 1, title: '물리 문제 풀이', category: '생물학', date: '2일 전', image: 'image1' },
  { id: 2, title: '2023 2학기 생물 중간 연습문제', category: '화학', date: '1달 전', image: 'image2' },
  { id: 3, title: '유기 화학 공부가이드', category: '물리', date: '3달 전', image: 'image3' },
  { id: 4, title: '위대한 개츠비 - 챕터 1', category: '수학', date: '5달 전', image: 'image4' },
];

const categories = ['생물학', '화학', '물리', '수학', '역사'];

export default function LearningMaterials() {
  const [selectedTab, setSelectedTab] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const router = useRouter(); // Expo Router 사용

  const filteredData = data.filter(item => 
    (selectedCategory === 'All' || item.category === selectedCategory)
  );

  return (
    <View style={styles.container}>
      {/* 상단 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setSelectedTab('All')} style={[styles.tabButton, selectedTab === 'All' && styles.activeTab]}>
          <Text style={selectedTab === 'All' ? styles.activeTabText : styles.tabText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('Documents')} style={[styles.tabButton, selectedTab === 'Documents' && styles.activeTab]}>
          <Text style={selectedTab === 'Documents' ? styles.activeTabText : styles.tabText}>Documents</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('Audio')} style={[styles.tabButton, selectedTab === 'Audio' && styles.activeTab]}>
          <Text style={selectedTab === 'Audio' ? styles.activeTabText : styles.tabText}>Audio</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('Video')} style={[styles.tabButton, selectedTab === 'Video' && styles.activeTab]}>
          <Text style={selectedTab === 'Video' ? styles.activeTabText : styles.tabText}>Video</Text>
        </TouchableOpacity>
      </View>

      {/* 카테고리 선택 */}
      <View style={styles.categoryContainer}>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.activeCategory,
            ]}
          >
            <Text style={selectedCategory === category ? styles.activeCategoryText : styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 자료 목록 */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemContainer} onPress={() => console.log(`${item.title} 클릭됨`)}>
            <View style={styles.itemContent}>
              {/* 이미지 대신 임시 텍스트 */}
              <View style={styles.imagePlaceholder} />
              <View>
                <Text>{item.title}</Text>
                <Text>{item.date}</Text>
              </View>
            </View>
            {/* 오른쪽 아이콘 (예시) */}
            <View style={styles.iconPlaceholder} />
          </TouchableOpacity>
        )}
      />

      {/* 오른쪽 하단 + 버튼 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/personalstudy/learning-materials/AddMaterial')} // Expo Router로 페이지 이동
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
   container:{
     flex :1 ,backgroundColor :'#fff',paddingHorizontal :20 ,paddingTop :20 ,
   },
   tabContainer:{
     flexDirection :'row',
     justifyContent :'space-between',
     marginBottom :10 ,
   },
   tabButton:{
     flex :1 ,
     paddingVertical :10 ,
     alignItems :'center',
   },
   tabText:{
     fontSize :16 ,
     color :'#555',
   },
   activeTab:{
     borderBottomWidth :2 ,
     borderBottomColor :'#4A90E2',
   },
   activeTabText:{
     fontSize :16 ,
     color :'#4A90E2',
     fontWeight :'bold',
   },

   categoryContainer:{
     flexDirection :'row',
     justifyContent :'space-between',
     marginBottom :15 ,
   },
   categoryButton:{
     paddingVertical :8 ,
     paddingHorizontal :15 ,
     backgroundColor :'#f0f0f0',
     borderRadius :20 ,
   },
   activeCategory:{
     backgroundColor :'#4A90E2',
   },
   categoryText:{
     color :'#555',
   },
   activeCategoryText:{
     color :'#fff',
   },

   itemContainer:{
     flexDirection :'row',
     justifyContent :'space-between',
     alignItems :'center',
     paddingVertical :15 ,
     borderBottomWidth :1 ,
     borderBottomColor :'#e0e0e0',
   },

   itemContent:{
     flexDirection :'row',
     alignItems :'center',
   },

   imagePlaceholder:{
     width :50,
     height :50,
     backgroundColor :'#ccc',
     borderRadius :5,
     marginRight :10,
   },

   iconPlaceholder:{
    width :24,
    height :24,
    backgroundColor:'#ccc',
    borderRadius :12,
   },

   addButton:{
    backgroundColor:'#4A90E2',
    width :60,
    height :60,
    borderRadius :30,
    justifyContent:'center',
    alignItems:'center',
    position:'absolute',
    bottom :20,
    right :20,
   },

   addButtonText:{
    color:'#fff',
    fontSize:30,
    fontWeight:'bold'
 }
});