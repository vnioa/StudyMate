import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For the pencil and plus icons

export default function QuizListScreen() {
  const quizzes = [
    { id: 1, title: '수학1' },
    { id: 2, title: '지구과학' },
    { id: 3, title: '영어문법3' },
    { id: 4, title: '삼국시대 퀴즈' },
    { id: 5, title: '90년대 미술퀴즈' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>퀴즈</Text>

      {/* Quiz List */}
      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.quizItem}>
            {/* Quiz Title */}
            <TouchableOpacity  style={styles.quizTitleContainer}>
              <Text style={styles.quizTitle}>{item.title}</Text>
            </TouchableOpacity>

            {/* Edit Button */}
            <TouchableOpacity >
              <Ionicons name="pencil" size={24} color="black" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  quizItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  quizTitleContainer: {
    flexGrow: 1,
  },

  quizTitle: {
    fontSize: 16,
    color: '#333',
  },

  addButton: {
    backgroundColor: '#4A90E2',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});