import React from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { supabase } from '../utils/supabase';

export default function Dashboard({ navigation }) {
  const logout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to RehabAI 👋</Text>
      <Text style={styles.subheading}>Your personal recovery companion</Text>
      <View style={styles.button}>
        <Button title="Log Pain Entry" onPress={() => navigation.navigate('PainLog')} />
      </View>
      <View style={styles.button}>
        <Button title="Logout" onPress={logout} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flex: 1, justifyContent: 'center', backgroundColor: '#fff' },
  heading: { fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  subheading: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 30 },
  button: { marginBottom: 16 },
});
