import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../utils/supabase';

export default function PainLogScreen({ navigation }) {
  const route = useRoute();
  const { injuryId } = route.params;

  const [painLevel, setPainLevel] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!painLevel || !description.trim()) {
      return Alert.alert('Missing Fields', 'Please enter both pain level and a short description.');
    }

    const parsedLevel = parseInt(painLevel);
    if (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 10) {
      return Alert.alert('Invalid Pain Level', 'Please enter a number between 1 and 10.');
    }

    setSubmitting(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      Alert.alert('Error', 'You are not logged in.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('pain_logs').insert({
      user_id: user.id,
      injury_id: injuryId,
      pain_level: parsedLevel,
      description: description.trim(),
    });

    setSubmitting(false);
    if (error) {
      Alert.alert('Submission Failed', error.message);
    } else {
      Alert.alert('Success', 'Pain entry saved.');
      setPainLevel('');
      setDescription('');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Log Your Pain Level</Text>
      <Text style={styles.label}>Pain level (1–10)</Text>
      <TextInput
        keyboardType="numeric"
        value={painLevel}
        onChangeText={setPainLevel}
        style={styles.input}
        placeholder="e.g., 6"
      />
      <Text style={styles.label}>Describe your pain</Text>
      <TextInput
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
        placeholder="Where does it hurt? When did it start?"
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
      />
      <View style={styles.button}>
        <Button title={submitting ? 'Submitting...' : 'Submit Entry'} onPress={handleSubmit} disabled={submitting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flex: 1, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: { marginTop: 10 },
});
