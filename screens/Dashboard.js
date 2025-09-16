import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Button, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../utils/supabase';

export default function Dashboard({ route, navigation }) {
  const injuryId = route?.params?.injuryId;
  const userId = route?.params?.userId;
  const [injury, setInjury] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect if no injury selected
  useEffect(() => {
    if (!injuryId) {
      Alert.alert("Missing Data", "No injury selected. Returning to injury list.");
      navigation.replace("InjuryManagement");
    }
  }, [injuryId]);

  // Header logout button
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

  // Fetch injury details
  useEffect(() => {
    const fetchInjury = async () => {
      if (!injuryId) return;

      const { data, error } = await supabase
        .from('injuries')
        .select(`
          id,
          start_date,
          is_active,
          injury_types_table (id, name)
        `)
        .eq('id', injuryId)
        .single();

      if (!error && data) setInjury(data);
      else Alert.alert('Error', 'Failed to fetch injury details: ' + error?.message);

      setLoading(false);
    };

    fetchInjury();
  }, [injuryId]);

  // Start Pose tracking
  const handleStartPose = () => {
    if (!injury) return;

    navigation.navigate('Pose', {
      injuryTypeId: injury.injury_types_table?.id,
      injuryTypeName: injury.injury_types_table?.name || 'Exercise',
      injuryId: injury.id,
      userId: userId,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text>Loading injury details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to RehabAI</Text>
      <Text style={styles.subheading}>Your personal recovery companion</Text>

      {injury && (
        <View style={styles.injuryBox}>
          <Text style={styles.injuryText}>
            Injury: {injury.injury_types_table?.name || injury.injury_type_id}
          </Text>
          <Text style={styles.injuryText}>
            Start Date: {new Date(injury.start_date).toDateString()}
          </Text>
          <Text style={styles.injuryText}>
            Status: {injury.is_active ? 'Active' : 'Healed'}
          </Text>
        </View>
      )}

      <View style={styles.button}>
        <Button title="Log Pain Entry" onPress={() => navigation.navigate('PainLog', { injuryId })} />
      </View>

      <View style={styles.button}>
        <Button title="View Pain History" onPress={() => navigation.navigate('PainHistory', { injuryId })} />
      </View>

      <View style={styles.button}>
        <Button title="View Analytics" onPress={() => navigation.navigate('Analytics', { injuryId })} />
      </View>

      <View style={styles.button}>
        <Button title="Start Pose Tracking" onPress={handleStartPose} />
      </View>
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
  injuryText: { fontSize: 14, marginBottom: 4 },
});
