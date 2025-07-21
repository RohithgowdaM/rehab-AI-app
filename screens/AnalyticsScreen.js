import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../utils/supabase';
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState([]);
  const [latestPain, setLatestPain] = useState(null);
  const [currentInjuryId, setCurrentInjuryId] = useState(null);

  const getLast7Days = () => {
    const today = new Date();
    return [...Array(7)].map((_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date.toISOString().slice(0, 10); // yyyy-mm-dd
    }).reverse();
  };

  const fetchCurrentInjury = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data: injuries, error: injuryError } = await supabase
      .from('injuries')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('start_date', { ascending: false })
      .limit(1);

    if (injuryError) {
      console.error('Error fetching current injury:', injuryError.message);
      return;
    }

    if (injuries.length > 0) {
      setCurrentInjuryId(injuries[0].id);
    } else {
      setLoading(false); // No active injury
    }
  };

  const fetchData = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !currentInjuryId) return;

    const { data, error } = await supabase
      .from('pain_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('injury_id', currentInjuryId);

    if (error) {
      console.error(error);
      return;
    }

    if (data.length > 0) {
      const last7 = getLast7Days();
      const grouped = last7.map((day) => {
        const entries = data.filter(d => d.timestamp.startsWith(day));
        const avg = entries.length > 0
          ? entries.reduce((sum, d) => sum + d.pain_level, 0) / entries.length
          : 0;
        return { day: day.slice(5), avg: Math.round(avg * 10) / 10 };
      });

      setDailyData(grouped);
      setLatestPain(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentInjury();
  }, []);

  useEffect(() => {
    if (currentInjuryId) {
      fetchData();
    }
  }, [currentInjuryId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#666" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🧠 Pain Analytics</Text>

      {dailyData.length === 0 ? (
        <Text style={styles.empty}>No pain data logged in the past week.</Text>
      ) : (
        <>
          <VictoryChart domainPadding={10}>
            <VictoryAxis tickFormat={(t) => t} />
            <VictoryAxis dependentAxis tickFormat={(x) => `${x}`} />
            <VictoryBar
              data={dailyData}
              x="day"
              y="avg"
              style={{ data: { fill: "#4caf50" } }}
            />
          </VictoryChart>

          <View style={styles.summary}>
            <Text style={styles.info}>📈 Last pain entry: {latestPain.pain_level}/10</Text>
            <Text style={styles.info}>📅 Logged: {new Date(latestPain.timestamp).toLocaleString()}</Text>
            <Text style={styles.info}>🗓️ Days logged: {dailyData.filter(d => d.avg > 0).length}/7</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flexGrow: 1 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  summary: { marginTop: 20 },
  info: { fontSize: 16, marginBottom: 8 },
  empty: { textAlign: 'center', fontSize: 16, color: '#888', marginTop: 40 },
});
