import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function GeneratedQuiz() {
  const [topic, setTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [description, setDescription] = useState('')

  const difficulties = ['쉬움', '보통', '어려움', '매우 어려움'];

  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>AI-퀴즈 생성</Text>

      {/* Topic Input */}
      <Text style={styles.label}>주제를 입력해주세요</Text>
      <TextInput
        style={styles.input}
        placeholder="입력"
        value={topic}
        onChangeText={setTopic}
      />

      {/* Difficulty Selection */}
      <Text style={styles.label}>난이도를 선택해주세요</Text>
      <View style={styles.difficultyContainer}>
        {difficulties.map((difficulty) => (
          <TouchableOpacity
            key={difficulty}
            style={[
              styles.difficultyButton,
              selectedDifficulty === difficulty && styles.selectedDifficultyButton,
            ]}
            onPress={() => handleDifficultySelect(difficulty)}
          >
            <Text
              style={[
                styles.difficultyText,
                selectedDifficulty === difficulty && styles.selectedDifficultyText,
              ]}
            >
              {difficulty}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

        {/* Detailed Description Input */}
        <TextInput
        style={styles.descriptionInput} 
        placeholder="상세 설명을 적어주세요"
        value={description}
        onChangeText={setDescription}
        multiline={true} 
        numberOfLines={4} 
      />
      {/* Create Question Button */}
      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonText}>Create question</Text>
      </TouchableOpacity>
    </View>
  );
}

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
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  difficultyButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    flexGrow: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedDifficultyButton: {
    backgroundColor: '#4A90E2',
  },
  difficultyText: {
    color: '#555',
  },
  selectedDifficultyText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  generatedContent: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});