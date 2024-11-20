import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';


const StudySession = () => {
  const [isSilent, setIsSilent] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [studyProgress, setStudyProgress] = useState(50); // 학습 진행도
  const [focusLevel, setFocusLevel] = useState(80); // 집중도

  return (
    <View style={styles.container}>
      {/* 포모도로 기법 */}
      <Text style={styles.title}>포모도로 기법</Text>
      <View style={styles.pomodoroContainer}>
        <Text style={styles.timer}>긴 휴식</Text>
        <Text style={styles.subtext}>4회 세션 후</Text>
        <Text style={styles.sessionTime}>25분</Text>
      </View>
      {/* 배경 사운드 */}
      <Text style={styles.sectionTitle}>배경 사운드</Text>
      <View style={styles.radioGroup}>
        {/* 무음 옵션 */}
        <TouchableOpacity onPress={() => setIsSilent(true)} style={styles.radioButtonContainer}>
          <View style={styles.radioButtonLabel}>
            <Text style={isSilent ? styles.radioSelectedText : styles.radioUnselectedText}>무음</Text>
          </View>
          <View style={[styles.radioCircle, isSilent && styles.radioCircleSelected]} />
        </TouchableOpacity>

        {/* 빗소리 옵션 */}
        <TouchableOpacity onPress={() => setIsSilent(false)} style={styles.radioButtonContainer}>
          <View style={styles.radioButtonLabel}>
            <Text style={!isSilent ? styles.radioSelectedText : styles.radioUnselectedText}>빗소리</Text>
            {!isSilent && <Text style={styles.soundDescription}>잔잔한 빗소리</Text>}
          </View>
          <View style={[styles.radioCircle, !isSilent && styles.radioCircleSelected]} />
        </TouchableOpacity>
      </View>

      {/* 방해금지모드 */}
      <View style={styles.switchContainer}>
        <Text>방해금지모드</Text>
        <Switch value={isFocusMode} onValueChange={(value) => setIsFocusMode(value)} />
      </View>

      {/* 집중 세션 진행 상황 */}
      <Text style={styles.sectionTitle}>집중 세션 진행 상황</Text>
      <View style={styles.progressContainer}>
        <Text>학습 진행도: {studyProgress}%</Text>
        <Text>프로그래스바 들어갈 자리</Text>
        <Text>12분 남음</Text>
      </View>

      {/* 집중도 */}
      <View style={styles.focusContainer}>
        <Text>집중도: </Text>
        <Text>{focusLevel}%</Text>
      </View>

      {/* 집중 시작 버튼 */}
      <TouchableOpacity style={styles.startButton}>
        <Text style={styles.buttonText}>집중 시작</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pomodoroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timer: {
    fontSize: 18,
    marginBottom: 5,
  },
  subtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  sessionTime: {
    fontSize: 16,
    color: '#888',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  
   radioGroup:{
     backgroundColor :'#f5f5f5' ,
     borderRadius :10 ,
     padding :10 ,
     marginBottom :20 
   },

   radioButtonContainer:{
    flexDirection :'row' ,
    justifyContent :'space-between' ,
    alignItems :'center' ,
    paddingVertical :10 ,
    borderBottomWidth :1 ,
    borderBottomColor :'#ddd'
  },

  radioButtonLabel:{
    flexDirection :'column'
  },

  radioCircle:{
    width :20 ,
    height :20 ,
    borderRadius :10 ,
    borderWidth :2 ,
    borderColor :'#888' 
  },

   radioCircleSelected:{
     borderColor :'#000' , // 선택된 경우 검정색 테두리
   },

   radioSelectedText:{
     color :'#000' , 
     fontWeight :'bold'
   },

   radioUnselectedText:{
     color :'#888'
   },

   soundDescription:{
    marginTop :5 , 
    color :'#888'
  },

   switchContainer:{
     flexDirection :'row' ,
     justifyContent :'space-between' ,
     alignItems :'center' ,
     marginBottom :20
   },

   progressContainer:{
     marginBottom :20 
   },

   focusContainer: {
    marginBottom: 20,
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
   startButton:{
     backgroundColor :'#007bff' ,
     paddingVertical :15 ,
     alignItems :'center' ,
     borderRadius :5 
   },

   buttonText:{
     color :'#fff' , 
     fontSize :16 , 
     fontWeight :'bold'
   }
});

export default StudySession;
