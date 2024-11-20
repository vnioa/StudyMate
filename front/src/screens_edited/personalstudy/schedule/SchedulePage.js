import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert} from 'react-native';
import DailyView from './DailyView'; // 일간 뷰 컴포넌트
import WeeklyView from './WeeklyView'; // 주간 뷰 컴포넌트
import MonthlyView from './MonthlyView'; // 월간 뷰 컴포넌트
import AddScheduleModal from './AddScheduleModal'; // 일정 추가 모달

export default function SchedulePage() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false); // 수정 모드인지 여부
  const [selectedSchedule, setSelectedSchedule] = useState(null); // 선택된 일정
  const [viewMode, setViewMode] = useState('daily'); // 현재 캘린더 뷰 모드 (daily, weekly, monthly)
  const [schedules, setSchedules] = useState([
    { id: 1, title: '수학 공부', date: '2024-11-15' },
    { id: 2, title: '영어 단어 암기', date: '2024-11-16' },
  ]);

  const addSchedule = (newSchedule) => {
    setSchedules([...schedules, newSchedule]);
    setModalVisible(false);
  };

  const updateSchedule = (updatedSchedule) => {
    setSchedules(schedules.map(schedule => schedule.id === updatedSchedule.id ? updatedSchedule : schedule));
    setEditMode(false);
    setModalVisible(false);
  };

  const deleteSchedule = (scheduleId) => {
    Alert.alert(
      "일정 삭제",
      "정말로 이 일정을 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { text: "삭제", onPress: () => setSchedules(schedules.filter(schedule => schedule.id !== scheduleId)) }
      ]
    );
  };

  // 현재 선택된 캘린더 뷰를 렌더링
  const renderCalendarView = () => {
    switch (viewMode) {
      case 'daily':
        return <DailyView />;
      case 'weekly':
        return <WeeklyView />;
      case 'monthly':
        return <MonthlyView />;
      default:
        return <DailyView />;
    }
  };

  return (
    <View style={styles.container}>
      {/* 캘린더 뷰 전환 버튼 */}
      <View style={styles.viewSwitcher}>
        <TouchableOpacity onPress={() => setViewMode('daily')} style={[styles.switchButton, viewMode === 'daily' && styles.activeButton]}>
          <Text style={viewMode === 'daily' ? styles.activeButtonText : styles.buttonText}>일간</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setViewMode('weekly')} style={[styles.switchButton, viewMode === 'weekly' && styles.activeButton]}>
          <Text style={viewMode === 'weekly' ? styles.activeButtonText : styles.buttonText}>주간</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setViewMode('monthly')} style={[styles.switchButton, viewMode === 'monthly' && styles.activeButton]}>
          <Text style={viewMode === 'monthly' ? styles.activeButtonText : styles.buttonText}>월간</Text>
        </TouchableOpacity>
      </View>

      {/* 캘린더 뷰 */}
      <View style={styles.calendarContainer}>
        {renderCalendarView()}
      </View>

      {/* 일정 목록 */}
      <View style={styles.scheduleListContainer}>
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onLongPress={() => {
                setSelectedSchedule(item);
                setEditMode(true);
              }}
              style={styles.scheduleItem}
            >
              <Text>{item.title}</Text>
              <Text>{item.date}</Text>

              {/* 꾹 눌렀을 때 수정/삭제 버튼 표시 */}
              {editMode && selectedSchedule?.id === item.id && (
                <View style={styles.editDeleteContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(true);
                      setEditMode(true);
                    }}
                    style={styles.editButton}
                  >
                    <Text style={styles.editButtonText}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteSchedule(item.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 오른쪽 하단 + 버튼 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setSelectedSchedule(null); // 새 일정 추가 시 선택된 일정 초기화
          setModalVisible(true);
        }}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* 일정 추가/수정 모달 */}
      <AddScheduleModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditMode(false); // 모달 닫힐 때 수정 모드 해제
        }}
        onSave={editMode ? updateSchedule : addSchedule} // 수정 모드면 업데이트 함수 호출
        scheduleToEdit={editMode ? selectedSchedule : null} // 수정할 일정 전달
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },

  // 캘린더 뷰 전환 버튼 영역
  viewSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  switchButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 5,
  },

  buttonText: {
    fontSize: 16,
    color: '#555',
  },

  activeButton: {
    backgroundColor: '#4A90E2',
  },

  activeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // 캘린더 영역 (화면의 상단 절반)
  calendarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  // 일정 목록 영역 (화면의 하단 절반)
  scheduleListContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
  },

  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
   },

   editDeleteContainer:{
     flexDirection :'row' ,
     justifyContent :'flex-end' ,alignItems :'center' ,
   },
   editButton:{
     backgroundColor :'#4A90E2' ,padding :10 ,borderRadius :5 ,marginRight :10 ,
   },
   editButtonText:{
     color :'#fff' ,fontWeight :'bold' ,
   },
   deleteButton:{
     backgroundColor :'#ff5c5c' ,padding :10 ,borderRadius :5 ,
   },
   deleteButtonText:{
     color :'#fff' ,fontWeight :'bold' ,
   },

   // 오른쪽 하단 + 버튼
   addButton:{
     backgroundColor :'#4A90E2' ,
     width :60 ,height :60 ,
     borderRadius :30 ,
     justifyContent :'center' ,
     alignItems :'center' ,
     position :'absolute' ,
     bottom :20 ,right :20 ,
   },
   addButtonText:{
     color :'#fff' ,fontSize :30 ,fontWeight :'bold' ,
   }
});
