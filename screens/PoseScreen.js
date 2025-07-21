import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';

export default function PoseScreen() {
  const handleStartEvaluation = () => {
    Alert.alert("Coming Soon", "Real-time pose tracking will be available in the next phase!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📷 Posture Evaluation</Text>
      <Text style={styles.subtitle}>Analyze your movements using pose estimation</Text>

      <View style={styles.previewBox}>
        <Image
          source={require('../assets/mock_pose.png')} // Placeholder image
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.overlay}>📍 Keypoints Overlay (Mock)</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleStartEvaluation}>
        <Text style={styles.buttonText}>Start Evaluation</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        We’ll enable real-time pose tracking using MediaPipe in the next update.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewBox: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: '#000000aa',
    color: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
