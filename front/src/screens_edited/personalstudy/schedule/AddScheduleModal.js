import React, { useState } from 'react';
import { View, TextInput, Modal, TouchableOpacity, Text, StyleSheet, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddScheduleModal({ visible, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [repeatDays, setRepeatDays] = useState([]);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const handleSave = () => {
    const newSchedule = {
      id: Date.now(),
      title,
      date,
      repeatDays,
      notificationEnabled,
    };
    onSave(newSchedule);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDate(new Date());
    setRepeatDays([]);
    setNotificationEnabled(false);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalHeader}>
        {/* 취소 버튼 */}
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelButton}>취소</Text>
        </TouchableOpacity>

        {/* 저장 버튼 */}
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>저장</Text>
        </TouchableOpacity>
      </View>

      {/* 제목 입력 */}
      <TextInput
        style={styles.input}
        placeholder="제목 입력"
        value={title}
        onChangeText={(text) => setTitle(text)}
      />

      {/* 날짜 및 시간 설정 */}
      <DateTimePicker
        value={date}
        mode="datetime"
        display="default"
        onChange={(event, selectedDate) => {
          const currentDate = selectedDate || date;
          setDate(currentDate);
        }}
      />

      {/* 반복 요일 선택 UI (직접 구현 필요) */}
      {/* 알림 설정 UI (Switch 사용) */}
      
      {/* 알림 설정 */}
      <View style={styles.notificationContainer}>
        <Text>알림 설정:</Text>
        <Switch
          value={notificationEnabled}
          onValueChange={(value) => setNotificationEnabled(value)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
   modalHeader:{
     flexDirection :'row' ,justifyContent :'space-between' ,paddingHorizontal :20 ,paddingVertical :10 ,
   },
   cancelButton:{
     fontSize :18 ,color :'#ff5c5c' ,
   },
   saveButton:{
     fontSize :18 ,color :'#4A90E2' ,
   },
   input:{
     marginVertical :20 ,paddingHorizontal :10 ,paddingVertical :15 ,borderWidth :1 ,borderColor :'#e0e0e0' ,borderRadius :5 ,
   }
});
