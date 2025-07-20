import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { supabase } from '../utils/supabase';

export default function PainLogScreen({ navigation }) {
  const [painLevel, setPainLevel] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return Alert.alert('Not logged in');

    const { error } = await supabase.from('pain_logs').insert({
      user_id: user.id,
      pain_level: parseInt(painLevel),
      description,
    });

    if (error) Alert.alert('Error', error.message);
    else {
      Alert.alert('Success', 'Pain entry saved.');
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
        <Button title="Submit Entry" onPress={handleSubmit} />
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
