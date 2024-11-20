import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function LearningResourceCenter() {
  const [activeTab, setActiveTab] = useState('강의');

  const renderContent = () => {
    switch (activeTab) {
      case '강의':
        return (
          <View>
            {/* 강의 리스트 */}
            <View style={styles.item}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>과학</Text>
                <Text style={styles.subtitle}>선문대학교</Text>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>학습 시작</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.imagePlaceholder} />
            </View>

            <View style={styles.item}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>심리학 입문</Text>
                <Text style={styles.subtitle}>선문대학교</Text>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>학습 시작</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.imagePlaceholder} />
            </View>

            <View style={styles.item}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>금융 시장 이해</Text>
                <Text style={styles.subtitle}>선문대학교</Text>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>학습 시작</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.imagePlaceholder} />
            </View>
          </View>
        );
      case '자료':
        return (
          <View>
            {/* 자료 리스트 */}
            <View style={styles.item}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>자기 주도 학습 과정</Text>
                <Text style={styles.subtitle}>자기 페이스에 맞게 학습하기</Text>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>탐색</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.imagePlaceholder} />
            </View>

            <View style={styles.item}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>학습 로드맵</Text>
                <Text style={styles.subtitle}>진로 개발을 위한 가이드 제공</Text>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>탐색</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.imagePlaceholder} />
            </View>
          </View>
        );
      case '공부 팁':
        return (
          <View>
            {/* 공부 팁 리스트 */}
            <View style={styles.item}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>노트를 효율적으로 쓰는 법</Text>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttontext}>글 읽기</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.imageplaceholder} />
            </View>

            <View style={styles.item}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>파일링 기법</Text>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttontext}>글 읽기</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.imageplaceholder} />
            </View>

            <View style={styles.item}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>시간 관리하는 방법</Text>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttontext}>글 읽기</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.imageplaceholder} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        {/* 뒤로가기 아이콘 */}
        <Ionicons name="arrow-back" size={24} color="#000" />
        {/* 제목 */}
        <Text style={styles.headerTitle}>학습 리소스 센터</Text>
      </View>

      {/* 탭 메뉴 */}
      <View style={styles.tabContainer}>
        {['강의', '자료', '공부 팁'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === tab && styles.activeTabLabel,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 콘텐츠 영역 */}
      <ScrollView>{renderContent()}</ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabButtonLabel: {
    fontSize: 16,
    color: '#888',
  },
  activeTabLabel: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  
  item: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 15,
    
   flexDirection:'row', 
   justifyContent:'space-between', 
   alignItems:'center' 
},
textContainer:{
flex :1 
},
title:{
fontSize :16,fontWeight :'bold'
},
subtitle:{
fontSize :14,color :'#888',marginTop :5},
button:{
backgroundColor :'#007bff',paddingVertical :8,paddingHorizontal :12,borderRadius :5,marginTop :10,width:'auto',alignSelf:'flex-start'}, 
buttontext:{
color :'#fff',fontweight :'bold'},
imageplaceholder:{
width :80,height :80,backgroundcolor :'#636060',borderRadius :5 
}});
