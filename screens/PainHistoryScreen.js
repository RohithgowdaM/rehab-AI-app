import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../utils/supabase';

export default function PainHistoryScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentInjuryId, setCurrentInjuryId] = useState(null);

  useEffect(() => {
    const fetchCurrentInjury = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Get the currently active injury
      const { data: injuries, error: injuryError } = await supabase
        .from('injuries')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('start_date', { ascending: false })
        .limit(1);

      if (injuryError) {
        console.error('Error fetching injury:', injuryError.message);
        return;
      }

      if (injuries.length > 0) {
        setCurrentInjuryId(injuries[0].id);
      }
    };

    fetchCurrentInjury();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user || !currentInjuryId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('pain_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('injury_id', currentInjuryId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setLogs(data);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [currentInjuryId]);

  const getSeverityEmoji = (level) => {
    if (level >= 8) return '🔥';
    if (level >= 5) return '⚠️';
    if (level >= 1) return '🙂';
    return '✅';
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.level}>
        {getSeverityEmoji(item.pain_level)} Pain: {item.pain_level}/10
      </Text>
      <Text style={styles.desc}>{item.description}</Text>
      <Text style={styles.time}>{new Date(item.timestamp).toLocaleString()}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#666" />;
  }

  return (
    <View style={styles.container}>
      {logs.length === 0 ? (
        <Text style={styles.empty}>No pain logs for this injury yet.</Text>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: '#fff' },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fefefe',
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  level: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  desc: { fontSize: 15, color: '#444', marginBottom: 6 },
  time: { fontSize: 13, color: '#888' },
  empty: { textAlign: 'center', fontSize: 16, marginTop: 40, color: '#777' },
});
