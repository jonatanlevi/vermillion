import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockLeaderboard, mockPrizePool, mockUser } from '../../mock/data';
import { useLanguage } from '../../context/LanguageContext';

const MEDALS = ['🥇','🥈','🥉'];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const myEntry = mockLeaderboard.find(u => u.id === mockUser.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{t.leaderboardTitle} — {mockPrizePool.month}</Text>

      <View style={styles.prizeRow}>
        {mockPrizePool.distribution.slice(0, 3).map((p, i) => (
          <View key={p.rank} style={styles.prizeItem}>
            <Text style={styles.prizeMedal}>{MEDALS[i]}</Text>
            <Text style={[styles.prizeAmount, i === 0 && { color: '#F0C040' }, i === 1 && { color: '#C0C0C0' }, i === 2 && { color: '#CD7F32' }]}>
              {t.currencySymbol}{(p.amount/1000).toFixed(0)}K
            </Text>
          </View>
        ))}
      </View>

      {myEntry && (
        <View style={styles.myRankCard}>
          <Text style={styles.myRankLabel}>{t.myRank}</Text>
          <Text style={styles.myRankValue}>#{myEntry.rank}</Text>
          <Text style={styles.myScore}>{myEntry.score}% {t.accuracyLabel}</Text>
        </View>
      )}

      <FlatList
        data={mockLeaderboard}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <UserRow item={item} isMe={item.id === mockUser.id} t={t} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function UserRow({ item, isMe, t }) {
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <View style={styles.rankBadge}>
        {item.rank <= 3
          ? <Text style={styles.medal}>{MEDALS[item.rank-1]}</Text>
          : <Text style={[styles.rankNum, isMe && styles.rankNumMe]}>#{item.rank}</Text>}
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, isMe && styles.userNameMe]}>
          {item.name}{isMe ? ' (You)' : ''}
        </Text>
        <Text style={styles.userStreak}>🔥 {item.streak} {t.streakLabel}</Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={[styles.score, isMe && styles.scoreMe]}>{item.score}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', paddingTop: 12 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '800', padding: 20, paddingBottom: 16 },
  prizeRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#111', marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E1E1E' },
  prizeItem: { alignItems: 'center', gap: 4 },
  prizeMedal: { fontSize: 28 },
  prizeAmount: { fontSize: 14, fontWeight: '700', color: '#888' },
  myRankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A0E0E', marginHorizontal: 20, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#C0392B', gap: 12 },
  myRankLabel: { color: '#C0392B', fontSize: 12, flex: 1 },
  myRankValue: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  myScore: { color: '#888', fontSize: 13 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#1E1E1E' },
  rowMe: { backgroundColor: '#1A0E0E', borderColor: '#C0392B' },
  rankBadge: { width: 36, alignItems: 'center' },
  medal: { fontSize: 22 },
  rankNum: { color: '#555', fontSize: 16, fontWeight: '700' },
  rankNumMe: { color: '#C0392B' },
  userInfo: { flex: 1 },
  userName: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  userNameMe: { color: '#C0392B' },
  userStreak: { color: '#555', fontSize: 12, marginTop: 2 },
  scoreContainer: { alignItems: 'flex-end' },
  score: { color: '#888', fontSize: 16, fontWeight: '700' },
  scoreMe: { color: '#FFF' },
});
