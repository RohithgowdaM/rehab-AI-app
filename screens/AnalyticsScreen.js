// screens/AnalyticsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { supabase } from '../utils/supabase';

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState([]);
  const [latestPain, setLatestPain] = useState(null);
  const [currentInjuryId, setCurrentInjuryId] = useState(null);
  const [noActiveInjury, setNoActiveInjury] = useState(false);

  // date range state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // tooltip
  const [tooltip, setTooltip] = useState(null);

  // utils
  const toDateKey = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const getDaysRange = (start, end) => {
    const days = [];
    let d = new Date(start);
    while (d <= end) {
      days.push({
        key: toDateKey(d),
        label: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`,
      });
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  const fetchCurrentInjury = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: injuries, error } = await supabase
      .from('injuries')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('start_date', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('Error fetching current injury:', error.message);
      setLoading(false);
      return;
    }
    if (!injuries || injuries.length === 0) {
      setNoActiveInjury(true);
      setLoading(false);
      return;
    }
    setCurrentInjuryId(injuries[0].id);
  };

  const fetchData = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !currentInjuryId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('pain_logs')
      .select('id, pain_level, timestamp')
      .eq('user_id', user.id)
      .eq('injury_id', currentInjuryId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (error) {
      console.warn('Error fetching pain logs:', error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setDailyData([]);
      setLatestPain(null);
      setLoading(false);
      return;
    }

    const days = getDaysRange(startDate, endDate);
    const byDay = Object.fromEntries(days.map((d) => [d.key, []]));

    data.forEach((row) => {
      const dt = new Date(row.timestamp);
      const key = toDateKey(dt);
      if (byDay[key]) byDay[key].push(row.pain_level);
    });

    const grouped = days.map(({ key, label }) => {
      const arr = byDay[key];
      const avg =
        arr.length > 0
          ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
          : 0;
      return { day: label, avg };
    });

    const latest = [...data].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    setDailyData(grouped);
    setLatestPain(latest);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchCurrentInjury();
  }, []);

  useEffect(() => {
    if (currentInjuryId) {
      fetchData();
    }
  }, [currentInjuryId, startDate, endDate]);

  if (loading) {
    return (
      <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#666" />
    );
  }

  if (noActiveInjury) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.header}>🧠 Pain Analytics</Text>
        <Text style={styles.empty}>
          No active injury selected. Go to Injury Management and activate one.
        </Text>
      </View>
    );
  }

  const chartHeight = 220;
  const barWidth = 40;
  const maxAvg = Math.max(10, ...dailyData.map((d) => d.avg));

  const summary = (() => {
    const vals = dailyData.map((d) => d.avg).filter((v) => v > 0);
    if (vals.length === 0) return { avg: 0, min: 0, max: 0, total: 0 };
    return {
      avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
      min: Math.min(...vals),
      max: Math.max(...vals),
      total: vals.length,
    };
  })();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🧠 Pain Analytics</Text>

      {/* Date range selectors */}
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={styles.dateText}>{startDate.toDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={styles.dateText}>{endDate.toDateString()}</Text>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={showStartPicker}
        mode="date"
        date={startDate}
        onConfirm={(date) => {
          if (date > endDate) {
            Alert.alert('Invalid range', 'Start date cannot be after end date.');
          } else if ((endDate - date) / (1000 * 3600 * 24) > 10) {
            Alert.alert('Invalid range', 'Maximum 10 days can be selected.');
          } else {
            setStartDate(date);
          }
          setShowStartPicker(false);
        }}
        onCancel={() => setShowStartPicker(false)}
      />
      <DateTimePickerModal
        isVisible={showEndPicker}
        mode="date"
        date={endDate}
        onConfirm={(date) => {
          if (date < startDate) {
            Alert.alert('Invalid range', 'End date cannot be before start date.');
          } else if ((date - startDate) / (1000 * 3600 * 24) > 10) {
            Alert.alert('Invalid range', 'Maximum 10 days can be selected.');
          } else {
            setEndDate(date);
          }
          setShowEndPicker(false);
        }}
        onCancel={() => setShowEndPicker(false)}
      />

      {(!dailyData || dailyData.length === 0) ? (
        <Text style={styles.empty}>No pain data logged for this range.</Text>
      ) : (
        <>
          {/* Chart inside horizontal scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chartScroll}
          >
            <View style={styles.chartBox}>
              <View style={styles.yAxis}>
                {[10, 8, 6, 4, 2, 0].map((val) => (
                  <Text key={val} style={styles.yTick}>{val}</Text>
                ))}
              </View>
              <View style={[styles.chartArea, { height: chartHeight }]}>
                {dailyData.map((d, idx) => {
                  const h = maxAvg > 0 ? (d.avg / maxAvg) * chartHeight : 0;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() =>
                        setTooltip(
                          tooltip?.day === d.day ? null : { day: d.day, avg: d.avg }
                        )
                      }
                      style={{ alignItems: 'center', marginHorizontal: 8 }}
                    >
                      {/* Tooltip above bar */}
                      {tooltip?.day === d.day && (
                        <View style={styles.tooltipBox}>
                          <Text style={styles.tooltipText}>{d.avg}/10</Text>
                        </View>
                      )}
                      <View
                        style={[styles.bar, { width: barWidth, height: h }]}
                      />
                      <Text style={styles.xLabel}>{d.day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Summary */}
          <View style={styles.summary}>
            {latestPain && (
              <>
                <Text style={styles.info}>
                  📈 Last entry: {latestPain.pain_level}/10
                </Text>
                <Text style={styles.info}>
                  📅 {new Date(latestPain.timestamp).toLocaleString()}
                </Text>
              </>
            )}
            <Text style={styles.info}>
              🗓️ Days logged: {summary.total}/{dailyData.length}
            </Text>
            <Text style={styles.info}>📊 Avg pain: {summary.avg}</Text>
            <Text style={styles.info}>⬇️ Min: {summary.min}</Text>
            <Text style={styles.info}>⬆️ Max: {summary.max}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#fff', flexGrow: 1 },
  containerCenter: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  empty: { textAlign: 'righ', fontSize: 16, color: '#888', marginTop: 8 },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6, // tighter spacing
  },
  dateBtn: { flex: 1, padding: 8, backgroundColor: '#2280B0', borderRadius: 6, marginHorizontal: 4 },
  dateText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  chartScroll: { marginTop: 6 },
  chartBox: { flexDirection: 'row', alignItems: 'flex-end', paddingRight: 8 },
  yAxis: {
    width: 28,
    alignItems: 'flex-end',
    paddingRight: 4,
    height: 220,
    justifyContent: 'space-between',
  },
  yTick: { fontSize: 12, color: '#666' },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#e0e0e0',
  },
  bar: { backgroundColor: '#4caf50', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  xLabel: { fontSize: 10, marginTop: 6, color: '#444' },
  summary: { marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 },
  info: { fontSize: 15, marginBottom: 4 },
  tooltipBox: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  tooltipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
