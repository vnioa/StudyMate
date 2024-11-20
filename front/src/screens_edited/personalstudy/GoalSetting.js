import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ProgressBarAndroid, ScrollView } from 'react-native';

const GoalSetting = () => {
  const [shortTermGoal, setShortTermGoal] = useState('7일 학습 도전');
  const [midTermGoal, setMidTermGoal] = useState('1개월');
  const [longTermGoal, setLongTermGoal] = useState('1년');
  const [goalAchievementRate, setGoalAchievementRate] = useState(45); // 목표 달성 가능성

  return (
    <ScrollView style={styles.container}>
      {/* 페이지 헤더 */}
      <Text style={styles.header}>학습 목표 설정</Text>

      {/* 단기 목표 */}
      <Text style={styles.sectionTitle}>단기 목표</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity onPress={() => setShortTermGoal('7일 학습 도전')} style={styles.radioButton}>
          <Text style={shortTermGoal === '7일 학습 도전' ? styles.radioSelected : styles.radioUnselected}>7일 학습 도전</Text>
          <Text>좋습니다</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShortTermGoal('14일 학습 도전')} style={styles.radioButton}>
          <Text style={shortTermGoal === '14일 학습 도전' ? styles.radioSelected : styles.radioUnselected}>14일 학습 도전</Text>
          <Text>엄청난데요?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShortTermGoal('30일 학습 도전')} style={styles.radioButton}>
          <Text style={shortTermGoal === '30일 학습 도전' ? styles.radioSelected : styles.radioUnselected}>30일 학습 도전</Text>
          <Text>꼭 이루시길 바래요!</Text>
        </TouchableOpacity>
      </View>

      {/* 중기 목표 */}
      <Text style={styles.sectionTitle}>중기 목표</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity onPress={() => setMidTermGoal('1개월')} style={styles.radioButton}>
          <Text style={midTermGoal === '1개월' ? styles.radioSelected : styles.radioUnselected}>1개월</Text>
          <Text>좋습니다</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMidTermGoal('3개월')} style={styles.radioButton}>
          <Text style={midTermGoal === '3개월' ? styles.radioSelected : styles.radioUnselected}>3개월</Text>
          <Text>엄청난데요?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMidTermGoal('6개월')} style={styles.radioButton}>
          <Text style={midTermGoal === '6개월' ? styles.radioSelected : styles.radioUnselected}>6개월</Text>
          <Text>꼭 이루시길 바래요!</Text>
        </TouchableOpacity>
      </View>

      {/* 장기 목표 */}
      <Text style={styles.sectionTitle}>장기 목표</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity onPress={() => setLongTermGoal('1년')} style={styles.radioButton}>
          <Text style={longTermGoal === '1년' ? styles.radioSelected : styles.radioUnselected}>1년</Text>
          <Text>좋습니다</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setLongTermGoal('2년')} style={styles.radioButton}>
          <Text style={longTermGoal === '2년' ? styles.radioSelected : styles.radioUnselected}>2년</Text>
          <Text>엄청난데요?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setLongTermGoal('5년')} style={styles.radioButton}>
          <Text style={longTermGoal === '5년' ? styles.radioSelected : styles.radioUnselected}>5년</Text>
          <Text>꼭 이루시길 바래요!</Text>
        </TouchableOpacity>
      </View>

      {/* 목표 달성 가능성 */}
      <View style={styles.progressContainer}>
        <Text>이 목표를 달성할 가능성은 %입니다</Text>
      </View>

      {/* 버튼 섹션 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#f0f0f0' }]}>
          <Text>목표 수정</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#f0f0f0' }]}>
          <Text>목표 삭제</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#007bff' }]}>
          <Text style={{ color: '#fff' }}>내 목표에 반영하기</Text>
        </TouchableOpacity>
      </View>

      {/* 개인화된 학습 챌린지 */}
      <View style={styles.challengeContainer}>
        <Text>개인화된 학습 챌린지</Text>

        {/* 챌린지 1 */}
        <View style={styles.challengeItem}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View><Text>챌린지 1</Text></View>
          </View>
          <View><Text>7일 동안 10개의 강의 완강하기</Text></View>
        </View>

        {/* 챌린지 2 */}
        <View style={styles.challengeItem}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View><Text>챌린지 2</Text></View>
          </View>
          <View><Text>14일 연속 3시간 이상 공부하기 80% 이상 달성하기</Text></View>
        </View>

      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  radioGroup: {
    marginBottom: 20,
  },
  radioButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  radioSelected: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  radioUnselected: {
    color: '#888',
  },
  progressContainer: {
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  button: {
    flexGrow: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  challengeContainer: {
    marginTop: 20,
  },
  challengeItem: {
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});

export default GoalSetting;