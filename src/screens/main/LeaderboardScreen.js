import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLeaderboard } from '../../services/storage';

const MEDALS = ['🥇','🥈','🥉'];
const PRIZES = [{ rank:1, amount:25000 }, { rank:2, amount:15000 }, { rank:3, amount:5000 }];
const MONTH_LABEL = new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then(data => { setRows(data); setLoading(false); });
  }, []);

  const myRow = rows.find(r => r.user_id === user?.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{t.leaderboardTitle} — {MONTH_LABEL}</Text>

      <View style={styles.prizeRow}>
        {PRIZES.map((p, i) => (
          <View key={p.rank} style={styles.prizeItem}>
            <Text style={styles.prizeMedal}>{MEDALS[i]}</Text>
            <Text style={[styles.prizeAmount, i === 0 && { color: '#F0C040' }, i === 1 && { color: '#C0C0C0' }, i === 2 && { color: '#CD7F32' }]}>
              {t.currencySymbol}{(p.amount/1000).toFixed(0)}K
            </Text>
          </View>
        ))}
      </View>

      {myRow && (
        <View style={styles.myRankCard}>
          <Text style={styles.myRankLabel}>{t.myRank}</Text>
          <Text style={styles.myRankValue}>#{myRow.rank}</Text>
          <Text style={styles.myScore}>{myRow.total_score} נקודות · {myRow.days} ימים</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#C0392B" size="large" />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>אין משתתפים עדיין החודש</Text>
          <Text style={styles.emptySub}>היה ראשון — לחץ את ה-stamp היומי שלך</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.user_id}
          renderItem={({ item }) => (
            <UserRow item={item} isMe={item.user_id === user?.id} t={t} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
          {item.name}{isMe ? ' (אני)' : ''}
        </Text>
        <Text style={styles.userDays}>📅 {item.days} ימים</Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={[styles.score, isMe && styles.scoreMe]}>{item.total_score}</Text>
        <Text style={styles.scoreLabel}>נקודות</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0A0A0A' },
  title:        { color: '#FFF', fontSize: 22, fontWeight: '800', padding: 20, paddingBottom: 16 },
  prizeRow:     { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#111', marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E1E1E' },
  prizeItem:    { alignItems: 'center', gap: 4 },
  prizeMedal:   { fontSize: 28 },
  prizeAmount:  { fontSize: 14, fontWeight: '700', color: '#888' },
  myRankCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A0E0E', marginHorizontal: 20, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#C0392B', gap: 12 },
  myRankLabel:  { color: '#C0392B', fontSize: 12, flex: 1 },
  myRankValue:  { color: '#FFF', fontSize: 20, fontWeight: '900' },
  myScore:      { color: '#888', fontSize: 13 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  empty:        { color: '#555', fontSize: 16, fontWeight: '700' },
  emptySub:     { color: '#333', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  list:         { paddingHorizontal: 20, paddingBottom: 100 },
  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#1E1E1E' },
  rowMe:        { backgroundColor: '#1A0E0E', borderColor: '#C0392B' },
  rankBadge:    { width: 36, alignItems: 'center' },
  medal:        { fontSize: 22 },
  rankNum:      { color: '#555', fontSize: 16, fontWeight: '700' },
  rankNumMe:    { color: '#C0392B' },
  userInfo:     { flex: 1 },
  userName:     { color: '#FFF', fontSize: 15, fontWeight: '600' },
  userNameMe:   { color: '#C0392B' },
  userDays:     { color: '#555', fontSize: 12, marginTop: 2 },
  scoreContainer: { alignItems: 'flex-end' },
  score:        { color: '#888', fontSize: 18, fontWeight: '900' },
  scoreMe:      { color: '#FFF' },
  scoreLabel:   { color: '#444', fontSize: 10 },
});
