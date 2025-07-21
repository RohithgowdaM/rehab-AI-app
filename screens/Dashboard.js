import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Button, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../utils/supabase';

export default function Dashboard({ route, navigation }) {
  const injuryId = route?.params?.injuryId;
  const [injury, setInjury] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!injuryId) {
      Alert.alert("Missing Data", "No injury selected. Returning to injury list.");
      navigation.replace("InjuryManagement");
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={async () => {
            await supabase.auth.signOut();
            navigation.replace('Login');
          }}
          title="Logout"
          color="red"
        />
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const fetchInjury = async () => {
      const { data, error } = await supabase
        .from('injuries')
        .select('injury_type, start_date, is_active')
        .eq('id', injuryId)
        .single();

      if (!error) setInjury(data);
      setLoading(false);
    };

    fetchInjury();
  }, [injuryId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading injury details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to RehabAI 👋</Text>
      <Text style={styles.subheading}>Your personal recovery companion</Text>

      {injury && (
        <View style={styles.injuryBox}>
          <Text style={styles.injuryText}>Injury: {injury.injury_type}</Text>
          <Text style={styles.injuryText}>Start Date: {new Date(injury.start_date).toDateString()}</Text>
          <Text style={styles.injuryText}>Status: {injury.is_active ? 'Active' : 'Healed'}</Text>
        </View>
      )}

      <View style={styles.button}><Button title="Log Pain Entry" onPress={() => navigation.navigate('PainLog', { injuryId })} /></View>
      <View style={styles.button}><Button title="View Pain History" onPress={() => navigation.navigate('PainHistory', { injuryId })} /></View>
      <View style={styles.button}><Button title="View Analytics" onPress={() => navigation.navigate('Analytics', { injuryId })} /></View>
      <View style={styles.button}><Button title="Start Pose Tracking" onPress={() => navigation.navigate('Pose', { injuryId })} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flex: 1, justifyContent: 'center', backgroundColor: '#fff' },
  heading: { fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  subheading: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 20 },
  button: { marginBottom: 16 },
  injuryBox: {
    marginBottom: 30,
    padding: 12,
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  injuryText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
