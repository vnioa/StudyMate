import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function PerformanceAnalysis() {
  const handlePress = (section) => {
    console.log(`${section} 클릭됨`);
    // 여기에 각 섹션별로 클릭 시 동작할 기능을 추가할 수 있습니다.
  };

  return (
    <ScrollView style={styles.container}>
      {/* 성과 분석 */}
      <Text style={styles.header}>성과 분석</Text>

      {/* 공부한 시간 */}
      <TouchableOpacity style={styles.card} onPress={() => handlePress('공부한 시간')}>
        <Text style={styles.cardTitle}>공부한 시간</Text>
        <Text style={styles.timeText}>3h 43m</Text>
        <Text style={styles.subText}>Last 7 days</Text>

        {/* 그래프 자리 (회색 네모) */}
        <View style={styles.graphPlaceholder} />
      </TouchableOpacity>

      {/* 퀴즈 점수 */}
      <TouchableOpacity style={styles.card} onPress={() => handlePress('퀴즈 점수')}>
        <Text style={styles.cardTitle}>퀴즈 점수</Text>
        <Text style={styles.timeText}>85%</Text>
        <Text style={styles.subText}>지난 7일</Text>

        {/* 그래프 자리 (회색 네모) */}
        <View style={styles.graphPlaceholder} />
      </TouchableOpacity>

      {/* AI 기반 분석 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI 기반 분석</Text>

        {/* 고유 학습 기록 */}
        <View style={styles.analysisItem}>
          <Ionicons name="bulb-outline" size={24} color="#000" />
          <View style={styles.analysisContent}>
            <Text>고유 학습 기록</Text>
            <Text style={styles.analysisDescription}>
              꾸준히 학습을 해나가고 있어요.
            </Text>
          </View>
        </View>

        {/* 공부하기 좋은 시간 */}
        <View style={styles.analysisItem}>
          <Ionicons name="time-outline" size={24} color="#000" />
          <View style={styles.analysisContent}>
            <Text>공부하기 좋은 시간이네요</Text>
            <Text style={styles.analysisDescription}>
              이 시간대에 집중력이 최고조에 달해요.
            </Text>
          </View>
        </View>
      </View>

      {/* 과목별 섹션 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>과목</Text>
        <TouchableOpacity
          onPress={() => handlePress('수학')}
          style={[styles.subjectItem]}
        >
          <Ionicons name="calculator-outline" size={24} color="#000" />
          <View style={[styles.subjectContent, { marginLeft: 5 }]}>
            <Text>수학</Text>
            <Text>평균 점수: 89%</Text>
          </View>
          <Text>2h 15m</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handlePress('영어')}
          style={[styles.subjectItem]}
        >
          <Ionicons name="book-outline" size={24} color="#000" />
          <View style={[styles.subjectContent, { marginLeft: 5 }]}>
            <Text>영어</Text>
            <Text>평균 점수: 84%</Text>
          </View>
          <Text>1h 30m</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handlePress('과학')}
          style={[styles.subjectItem]}
        >
          <Ionicons name="flask-outline" size={24} color="#000" />
          <View style={[styles.subjectContent, { marginLeft: 5 }]}>
            <Text>과학</Text>
            <Text>평균 점수: 89%</Text>
          </View>
          <Text>1h 15m</Text>
        </TouchableOpacity>
      </View>

      {/* 목표 달성률 */}
      <TouchableOpacity
        onPress={() => handlePress('목표 달성률')}
        style={[styles.card, { marginTop: 20 }]}
      >
        <Ionicons name="trophy-outline" size={24} color="#000" />
        <View style={{ marginLeft: 10 }}>
          <Text>목표 달성률</Text>
          <Text>79%</Text>
        </View>
      </TouchableOpacity>

      {/* 학습 추천 */}
      <View style={[styles.section, { marginTop: 20 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity
          onPress={() => handlePress('금융')}
          style={[styles.recommendationItem]}
        >
          <Ionicons name="card-outline" size={40} color="#000" />
          <View style={{ marginLeft: 10 }}>
            <Text>금융</Text>
            <Text>내일 시작 예정</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handlePress('안체')}
          style={[styles.recommendationItem]}
        >
          {/* 임시로 아이콘 사용 */}
          <Ionicons name="bed-outline" size={40} color="#000" />
          <View style={{ marginLeft: 10 }}>
            <Text>인체</Text>
            <Text>내일 시작 예정</Text>
          </View>
        </TouchableOpacity>
      </View>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    header: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    
    /* 카드 스타일 (공부한 시간, 퀴즈 점수) */
    card: {
      backgroundColor: '#f9f9f9',
      paddingVertical: 20,
      paddingHorizontal: 15,
      borderRadius: 10,
      marginBottom: 15,
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      borderColor: '#e0e0e0', // 테두리 색상
      borderWidth: 1, // 테두리 두께
    },
    
    /* 카드 타이틀 */
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    
    /* 시간 텍스트 (공부한 시간, 퀴즈 점수) */
    timeText: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    
    /* 서브 텍스트 (Last 7 days 등) */
    subText: {
      fontSize: 12,
      color: '#888',
      marginBottom: 15,
    },
    
    /* 그래프 자리 (회색 네모) */
    graphPlaceholder:{
      width :'100%',
      height :80,
      backgroundColor :'#e0e0e0', // 회색 네모로 대체
      borderRadius :5, // 모서리 둥글게 처리
  },
    
  /* AI 기반 분석 섹션 */
  section:{
  marginBottom :20
  },
  sectionTitle:{
  fontSize :16,fontWeight :'bold',marginBottom :10},
  
  /* AI 기반 분석 아이템 */
  analysisItem:{
  flexDirection :'row',
  alignItems :'center',
  paddingVertical :15,
  paddingHorizontal :10,
  backgroundColor :'#f9f9f9',
  borderRadius :10,
  marginBottom :10, // 각 항목 간격
  borderWidth :1, // 테두리 두께 추가
  borderColor :'#e0e0e0' // 테두리 색상 추가
  },
  
  /* AI 분석 내용 */
  analysisContent:{
  marginLeft :10
  },
  analysisDescription:{
  color :'#888',fontSize :12},
  
  /* 과목별 섹션 */
  subjectItem:{
  flexDirection :'row',
  alignItems :'center',
  justifyContent :'space-between',
  paddingVertical :15,
  borderBottomWidth :1,
  borderBottomColor :'#e0e0e0'
  },
  subjectContent:{
  marginLeft :5
  },
  
  /* 목표 달성률 카드 */
  goalCard:{
  backgroundColor:'#f9f9f9',
  paddingVertical :20,
  paddingHorizontal :15,
  borderRadius :10,
  marginTop :20, // 상단 여백 추가
  flexDirection :'row',alignItems:'center',borderWidth :1,borderColor:'#e0e0e0'
  
  },
  
  /* 학습 추천 섹션 */
  recommendationItem: {
    flexDirection: 'row',       
    alignItems: 'center',       
    paddingVertical: 15,        
    paddingHorizontal: 10,    
    borderRadius: 10,         
    backgroundColor: '#f9f9f9', 
    borderWidth: 1,             
    borderColor: '#e0e0e0',    
    marginBottom: 10           
  },})