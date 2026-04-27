import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RunnerGame from '../../components/RunnerGame';
import BreakoutGame from '../../components/BreakoutGame';
import ObstacleGame from '../../components/ObstacleGame';

const GAMES = [
  { key: 'runner',   label: 'ריצת VerMillion', emoji: '🏃', desc: 'קפוץ מעל חובות וריביות',   color: '#C0392B' },
  { key: 'breakout', label: 'שבור את החובות',  emoji: '🧱', desc: 'כדור ומחבט — שבור הכל',    color: '#E67E22' },
  { key: 'obstacle', label: 'מרוץ המכשולים',   emoji: '🐦', desc: 'עוף מעל המכשולים הפיננסיים', color: '#8E44AD' },
];

const MONTH_DAYS_LEFT = 23;
const USER_SCORE = 2340;
const USER_RANK = 3;

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const [activeGame, setActiveGame] = useState(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [totalScore, setTotalScore] = useState(USER_SCORE);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function selectGame(key) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setActiveGame(key);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }

  function handleGameFinish(score) {
    setSessionScore(score);
    setTotalScore(prev => prev + score);
    setActiveGame(null);
  }

  if (activeGame) {
    return (
      <Animated.View style={[styles.gameFullscreen, { opacity: fadeAnim, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.exitBtn} onPress={() => setActiveGame(null)}>
          <Text style={styles.exitBtnText}>✕ יציאה</Text>
        </TouchableOpacity>

        {activeGame === 'runner'   && <RunnerGame   onFinish={handleGameFinish} />}
        {activeGame === 'breakout' && <BreakoutGame onFinish={handleGameFinish} />}
        {activeGame === 'obstacle' && <ObstacleGame onFinish={handleGameFinish} />}
      </Animated.View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>אתגר החודש</Text>
        <View style={styles.daysLeftBadge}>
          <Text style={styles.daysLeftText}>{MONTH_DAYS_LEFT} ימים</Text>
        </View>
      </View>

      {/* Score bar */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreValue}>#{USER_RANK}</Text>
          <Text style={styles.scoreLabel}>דירוג</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreValue}>{totalScore.toLocaleString()}</Text>
          <Text style={styles.scoreLabel}>ניקוד</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreValue}>×1.2</Text>
          <Text style={styles.scoreLabel}>מכפיל</Text>
        </View>
      </View>

      {sessionScore > 0 && (
        <View style={styles.sessionBanner}>
          <Text style={styles.sessionText}>+{sessionScore} נקודות הסשן האחרון 🔥</Text>
        </View>
      )}

      {/* Games */}
      <Text style={styles.sectionTitle}>בחר משחק</Text>

      {GAMES.map(game => (
        <TouchableOpacity
          key={game.key}
          style={[styles.gameCard, { borderColor: game.color + '44' }]}
          onPress={() => selectGame(game.key)}
          activeOpacity={0.85}
        >
          <View style={[styles.gameEmoji, { backgroundColor: game.color + '22' }]}>
            <Text style={styles.gameEmojiText}>{game.emoji}</Text>
          </View>
          <View style={styles.gameInfo}>
            <Text style={styles.gameLabel}>{game.label}</Text>
            <Text style={styles.gameDesc}>{game.desc}</Text>
          </View>
          <View style={[styles.playBtn, { backgroundColor: game.color }]}>
            <Text style={styles.playBtnText}>▶</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Prize info */}
      <View style={styles.prizeCard}>
        <Text style={styles.prizeTitle}>🏆 פרס חודשי</Text>
        <Text style={styles.prizeAmount}>₪45,000</Text>
        <Text style={styles.prizeSub}>לשחקן עם הניקוד הגבוה ביותר בסוף החודש</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  gameFullscreen: { flex: 1, backgroundColor: '#0A0A0A', paddingHorizontal: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  daysLeftBadge: { backgroundColor: '#1A0808', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#C0392B44' },
  daysLeftText: { color: '#C0392B', fontSize: 13, fontWeight: '800' },

  scoreCard: {
    flexDirection: 'row', backgroundColor: '#111', borderRadius: 16,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E1E1E',
    justifyContent: 'space-around', alignItems: 'center',
  },
  scoreItem: { alignItems: 'center' },
  scoreValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  scoreLabel: { color: '#555', fontSize: 11, marginTop: 2 },
  scoreDivider: { width: 1, height: 32, backgroundColor: '#222' },

  sessionBanner: {
    backgroundColor: '#0D1A0D', borderRadius: 10, padding: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#1A3A1A', alignItems: 'center',
  },
  sessionText: { color: '#27AE60', fontSize: 14, fontWeight: '700' },

  sectionTitle: { color: '#555', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },

  gameCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#111', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1,
  },
  gameEmoji: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gameEmojiText: { fontSize: 26 },
  gameInfo: { flex: 1 },
  gameLabel: { color: '#FFF', fontSize: 16, fontWeight: '800', textAlign: 'right' },
  gameDesc: { color: '#555', fontSize: 12, marginTop: 3, textAlign: 'right' },
  playBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  playBtnText: { color: '#FFF', fontSize: 16 },

  prizeCard: {
    backgroundColor: '#1A1400', borderRadius: 16, padding: 20,
    marginTop: 8, borderWidth: 1, borderColor: '#D4AF3744', alignItems: 'center',
  },
  prizeTitle: { color: '#D4AF37', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  prizeAmount: { color: '#D4AF37', fontSize: 36, fontWeight: '900', marginBottom: 4 },
  prizeSub: { color: '#7A6A20', fontSize: 13, textAlign: 'center' },

  exitBtn: { alignSelf: 'flex-start', padding: 12, marginBottom: 8 },
  exitBtnText: { color: '#C0392B', fontSize: 15, fontWeight: '700' },
});
