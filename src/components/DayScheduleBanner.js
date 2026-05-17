import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDayScheduleView } from '../utils/dayScheduleDisplay';

/**
 * באנר שעון — מציג יום, טווח, ויעד לפי שישי/שבת/חול.
 */
export default function DayScheduleBanner({ commitTime }) {
  const [view, setView] = useState(() => getDayScheduleView(commitTime));

  useEffect(() => {
    setView(getDayScheduleView(commitTime));
    const id = setInterval(() => setView(getDayScheduleView(commitTime)), 30_000);
    return () => clearInterval(id);
  }, [commitTime]);

  if (!commitTime) return null;

  const modeStyle =
    view.mode === 'friday'   ? styles.friday :
    view.mode === 'saturday' ? styles.saturday :
    styles.weekday;

  return (
    <View style={[styles.wrap, modeStyle]}>
      <Text style={styles.headline}>{view.headline}</Text>
      <Text style={styles.nowLine}>{view.nowLine}</Text>
      {view.windowLine ? (
        <Text style={styles.windowLine}>{view.windowLine}</Text>
      ) : null}
      <Text style={styles.targetLine}>{view.targetLine}</Text>
      {view.targetStr ? (
        <Text style={styles.bigClock}>{view.targetStr}</Text>
      ) : (
        <Text style={styles.bigClockMuted}>--:--</Text>
      )}
      <Text style={styles.hint}>{view.clockHint}</Text>
      {view.statusLine && !view.open ? (
        <Text style={styles.status}>{view.statusLine}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  friday:   { backgroundColor: '#12100A', borderColor: '#D4AF3755' },
  saturday: { backgroundColor: '#0A0E14', borderColor: '#5DADE255' },
  weekday:  { backgroundColor: '#100A0A', borderColor: '#C0392B44' },
  headline:     { color: '#FFF', fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: 6 },
  nowLine:      { color: '#888', fontSize: 13, textAlign: 'right', marginBottom: 4 },
  windowLine:   { color: '#D4AF37', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  targetLine:   { color: '#AAA', fontSize: 12, textAlign: 'right', marginBottom: 6 },
  bigClock:     { color: '#D4AF37', fontSize: 42, fontWeight: '900', letterSpacing: 2 },
  bigClockMuted:{ color: '#444', fontSize: 42, fontWeight: '900' },
  hint:         { color: '#666', fontSize: 11, textAlign: 'right', marginTop: 4 },
  status:       { color: '#E67E22', fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: 8 },
});
