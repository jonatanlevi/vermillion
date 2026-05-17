import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLeaderboard, getLeaderboardWeekly } from '../../services/storage';
import Avatar3D from '../../components/Avatar3D';

const MEDALS = ['🥇','🥈','🥉','4️⃣','5️⃣'];

// Weekly prize pool: ₪11,250/week (₪45,000/month ÷ 4)
// Distributed: 35% / 25% / 20% / 12% / 8%
const WEEKLY_PRIZES = [3940, 2810, 2250, 1350, 900];
// Monthly prize pool — top 3
const MONTHLY_PRIZES = [{ rank:1, amount:25000 }, { rank:2, amount:15000 }, { rank:3, amount:5000 }];

function getWeekLabel() {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = d => d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
  return `${fmt(start)}–${fmt(end)}`;
}

const MONTH_LABEL = new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [tab, setTab]           = useState('weekly');
  const [weekRows, setWeekRows] = useState([]);
  const [monthRows, setMonthRows] = useState([]);
  const [loading, setLoading]   = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [weekly, monthly] = await Promise.all([getLeaderboardWeekly(), getLeaderboard()]);
    setWeekRows(weekly);
    setMonthRows(monthly);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const rows  = tab === 'weekly' ? weekRows : monthRows;
  const myRow = rows.find(r => r.user_id === user?.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>

      {/* Header */}
      <Text style={styles.title}>לוח המובילים</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'weekly' && styles.tabActive]}
          onPress={() => setTab('weekly')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'weekly' && styles.tabTextActive]}>שבועי</Text>
          <Text style={[styles.tabSub, tab === 'weekly' && styles.tabSubActive]}>{getWeekLabel()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'monthly' && styles.tabActive]}
          onPress={() => setTab('monthly')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'monthly' && styles.tabTextActive]}>חודשי</Text>
          <Text style={[styles.tabSub, tab === 'monthly' && styles.tabSubActive]}>{MONTH_LABEL}</Text>
        </TouchableOpacity>
      </View>

      {/* Prize bar */}
      {tab === 'weekly' ? (
        <>
          <View style={styles.prizeRow}>
            {WEEKLY_PRIZES.map((amount, i) => (
              <View key={i} style={styles.prizeItem}>
                <Text style={styles.prizeMedal}>{MEDALS[i]}</Text>
                <Text style={[styles.prizeAmount,
                  i === 0 && { color: '#F0C040' },
                  i === 1 && { color: '#C0C0C0' },
                  i === 2 && { color: '#CD7F32' },
                ]}>
                  ₪{amount.toLocaleString('he-IL')}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.prizeNote}>5 זוכים כל שבוע · מינימום 7 ימי השתתפות בחודש</Text>
        </>
      ) : (
        <View style={styles.prizeRow}>
          {MONTHLY_PRIZES.map((p, i) => (
            <View key={p.rank} style={styles.prizeItem}>
              <Text style={styles.prizeMedal}>{MEDALS[i]}</Text>
              <Text style={[styles.prizeAmount,
                i === 0 && { color: '#F0C040' },
                i === 1 && { color: '#C0C0C0' },
                i === 2 && { color: '#CD7F32' },
              ]}>
                ₪{(p.amount/1000).toFixed(0)}K
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* My rank card */}
      {myRow && (
        <View style={styles.myRankCard}>
          <View style={styles.myAvatarWrap}>
            <Avatar3D
              archetype={myRow.avatar_style?.archetype || 'builder'}
              userId={myRow.user_id}
              equipment={myRow.avatar_style?.equipment || []}
              overrides={myRow.avatar_style?.overrides || {}}
              size={44}
              showGlow={false}
              accentColor="#C0392B"
            />
          </View>
          <Text style={styles.myRankLabel}>הדירוג שלי</Text>
          <Text style={styles.myRankValue}>#{myRow.rank}</Text>
          <Text style={styles.myScore}>
            {tab === 'weekly'
              ? `${myRow.week_score} נק' השבוע · ${myRow.month_days}י' החודש`
              : `${myRow.total_score} נק' · ${myRow.days}י'`}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#C0392B" size="large" />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>
            {tab === 'weekly' ? 'אין זכאים השבוע עדיין' : 'אין משתתפים עדיין החודש'}
          </Text>
          <Text style={styles.emptySub}>
            {tab === 'weekly'
              ? 'נדרשים 7 ימי השתתפות בחודש — המשך לשחק!'
              : 'היה ראשון — לחץ את ה-stamp היומי שלך'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.user_id}
          renderItem={({ item }) => (
            <UserRow item={item} isMe={item.user_id === user?.id} weekly={tab === 'weekly'} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function UserRow({ item, isMe, weekly }) {
  const archetype = item.avatar_style?.archetype || 'builder';
  const prize = weekly ? WEEKLY_PRIZES[item.rank - 1] : null;

  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <View style={styles.rankBadge}>
        {item.rank <= 5
          ? <Text style={styles.medal}>{MEDALS[item.rank-1]}</Text>
          : <Text style={[styles.rankNum, isMe && styles.rankNumMe]}>#{item.rank}</Text>}
      </View>
      <View style={styles.avatarWrap}>
        <Avatar3D
          archetype={archetype}
          userId={item.user_id}
          equipment={item.avatar_style?.equipment || []}
          overrides={item.avatar_style?.overrides || {}}
          size={48}
          showGlow={false}
          accentColor={isMe ? '#C0392B' : undefined}
        />
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, isMe && styles.userNameMe]}>
          {item.name}{isMe ? ' (אני)' : ''}
        </Text>
        {weekly
          ? <Text style={styles.userDays}>📅 {item.month_days} ימים החודש</Text>
          : <Text style={styles.userDays}>📅 {item.days} ימים</Text>}
      </View>
      <View style={styles.scoreContainer}>
        <Text style={[styles.score, isMe && styles.scoreMe]}>
          {weekly ? item.week_score : item.total_score}
        </Text>
        <Text style={styles.scoreLabel}>נקודות</Text>
        {prize && <Text style={styles.prizeTag}>₪{prize.toLocaleString('he-IL')}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0A0A0A' },
  title:          { color: '#FFF', fontSize: 22, fontWeight: '800', paddingHorizontal: 20, paddingBottom: 12 },
  tabs:           { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: '#111', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#1E1E1E' },
  tab:            { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  tabActive:      { backgroundColor: '#C0392B' },
  tabText:        { color: '#555', fontSize: 14, fontWeight: '700' },
  tabTextActive:  { color: '#FFF' },
  tabSub:         { color: '#333', fontSize: 10, marginTop: 2 },
  tabSubActive:   { color: 'rgba(255,255,255,0.7)' },
  prizeRow:       { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#111', marginHorizontal: 20, borderRadius: 16, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#1E1E1E' },
  prizeItem:      { alignItems: 'center', gap: 2 },
  prizeMedal:     { fontSize: 22 },
  prizeAmount:    { fontSize: 12, fontWeight: '700', color: '#888' },
  prizeNote:      { color: '#333', fontSize: 11, textAlign: 'center', marginHorizontal: 20, marginBottom: 12 },
  myRankCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A0E0E', marginHorizontal: 20, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#C0392B', gap: 10 },
  myAvatarWrap:   { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: '#111' },
  myRankLabel:    { color: '#C0392B', fontSize: 12, flex: 1 },
  myRankValue:    { color: '#FFF', fontSize: 20, fontWeight: '900' },
  myScore:        { color: '#888', fontSize: 11 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  empty:          { color: '#555', fontSize: 16, fontWeight: '700' },
  emptySub:       { color: '#333', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  list:           { paddingHorizontal: 20, paddingBottom: 100 },
  row:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 12, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#1E1E1E' },
  rowMe:          { backgroundColor: '#1A0E0E', borderColor: '#C0392B' },
  rankBadge:      { width: 32, alignItems: 'center' },
  medal:          { fontSize: 20 },
  rankNum:        { color: '#555', fontSize: 16, fontWeight: '700' },
  rankNumMe:      { color: '#C0392B' },
  avatarWrap:     { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1A1A1A' },
  userInfo:       { flex: 1 },
  userName:       { color: '#FFF', fontSize: 15, fontWeight: '600' },
  userNameMe:     { color: '#C0392B' },
  userDays:       { color: '#555', fontSize: 12, marginTop: 2 },
  scoreContainer: { alignItems: 'flex-end' },
  score:          { color: '#888', fontSize: 18, fontWeight: '900' },
  scoreMe:        { color: '#FFF' },
  scoreLabel:     { color: '#444', fontSize: 10 },
  prizeTag:       { color: '#D4AF37', fontSize: 11, fontWeight: '700', marginTop: 2 },
});
