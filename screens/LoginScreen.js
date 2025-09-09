import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { supabase } from '../utils/supabase';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data?.user) {
        return Alert.alert('Login Failed', error?.message || 'Unknown error');
      }

      // Check if user profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile query failed:', profileError);
      }

      if (profileData) {
        navigation.replace('Dashboard');
      } else {
        navigation.replace('UserInfo');
      }
    } catch (err) {
      console.error('Login exception:', err);
      Alert.alert('Login Error', 'Something went wrong. Try again.');
    }
  };

  const handleSignup = async () => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return Alert.alert('Signup error', error.message);

      Alert.alert('Success', 'Check your email to confirm signup.', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
    } catch (err) {
      console.error('Signup exception:', err);
      Alert.alert('Signup Error', 'Something went wrong. Try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RehabAI</Text>
      <TextInput
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        style={styles.input}
      />
      <View style={styles.buttonWrapper}>
        <Button title="Login" onPress={handleLogin} />
      </View>
      <Text style={styles.divider}>──────── or ────────</Text>
      <View style={styles.buttonWrapper}>
        <Button title="Sign Up" onPress={handleSignup} color="#666" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flex: 1, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonWrapper: { marginBottom: 12 },
  divider: { textAlign: 'center', marginVertical: 10, color: '#999' },
});
