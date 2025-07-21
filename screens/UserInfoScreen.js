import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '../utils/supabase';
import { useNavigation } from '@react-navigation/native';

const UserInfoScreen = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const checkIfUserInfoExists = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        navigation.replace('InjuryManagement');
      }
    };

    checkIfUserInfoExists();
  }, []);

  const handleSubmit = async () => {
    if (!name || !age) {
      Alert.alert('Incomplete Fields', 'Please fill all the fields.');
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      Alert.alert('Auth Error', 'User not found.');
      return;
    }

    const { error } = await supabase.from('user_profiles').upsert({
      id: user.id,
      name,
      age: parseInt(age),
    });

    if (error) {
      Alert.alert('Error', 'Could not save data: ' + error.message);
    } else {
      setName('');
      setAge('');
      navigation.replace('InjuryManagement');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Full Name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Enter full name" style={styles.input} />

      <Text style={styles.label}>Age</Text>
      <TextInput value={age} onChangeText={setAge} keyboardType="numeric" placeholder="Enter age" style={styles.input} />

      <View style={styles.buttonContainer}>
        <Button title="Save & Continue" onPress={handleSubmit} />
      </View>
    </View>
  );
};

export default UserInfoScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  buttonContainer: { marginTop: 30 }
});
