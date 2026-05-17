import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_GHOSTS } from '../../mock/ghostRegistry';
import {
  activateGhostPlay,
  advanceGhostPlayDay,
  endGhostPlay,
  getGhostPlayMeta,
  getGhostPlaySession,
  jumpGhostPlayToWeekday,
  skipToRealWeek,
  GHOST_PLAY_TOTAL_DAYS,
} from '../../services/ghostPlaySession';
import { getEffectiveNow } from '../../services/ghostPlaySession';
import { writeLocalUserId } from '../../services/supabase';

export default function GhostPlayScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(null);
  const [clockLabel, setClockLabel] = useState('');

  const refresh = useCallback(async () => {
    await getGhostPlaySession();
    setMeta(getGhostPlayMeta());
    const now = getEffectiveNow();
    const days = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    setClockLabel(
      `${days[now.getDay()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} (מדומה)`,
    );
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function startGhost(ghostId) {
    setLoading(ghostId);
    try {
      await activateGhostPlay(ghostId);
      if (Platform.OS === 'web') window.location.reload();
      else await refresh();
    } catch (e) {
      const msg = e?.message || String(e);
      if (Platform.OS === 'web') window.alert(msg);
    }
    setLoading(null);
  }

  async function act(fn) {
    setLoading('act');
    await fn();
    await refresh();
    setLoading(null);
  }

  async function stopGhost() {
    await endGhostPlay();
    await writeLocalUserId(`local_${Date.now()}`);
    if (Platform.OS === 'web') window.location.reload();
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>משחק רפאים · 14 יום</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {meta ? (
          <View style={s.banner}>
            <Text style={s.bannerTitle}>{meta.ghostName}</Text>
            <Text style={s.bannerSub}>
              {meta.weekLabelHe} · {meta.weekDayLabel} · תוכנית יום {meta.programDay}/{GHOST_PLAY_TOTAL_DAYS}
            </Text>
            <Text style={s.bannerClock}>{clockLabel}</Text>
            <View style={s.btnRow}>
              <GhostBtn label="+1 יום" onPress={() => act(() => advanceGhostPlayDay(1))} small />
              <GhostBtn label="שבוע אמיתי (יום 8)" onPress={() => act(skipToRealWeek)} small />
              <GhostBtn label="קפוץ לשישי" onPress={() => act(() => jumpGhostPlayToWeekday(5))} small />
              <GhostBtn label="קפוץ לשבת" onPress={() => act(() => jumpGhostPlayToWeekday(6))} small />
            </View>
            <TouchableOpacity style={s.endBtn} onPress={stopGhost}>
              <Text style={s.endText}>סיים משחק רפא</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={s.hint}>
            בחר פרסונה — שבוע 1 «אתגר» (שאלון + משחקים), שבוע 2 «אמיתי» (DNA, חתימה, שישי/שבת).
            הכל לוקאלי, לא נשמר ב-Supabase.
          </Text>
        )}

        {ALL_GHOSTS.map((g) => (
          <TouchableOpacity
            key={g.id}
            style={s.ghostRow}
            onPress={() => startGhost(g.id)}
            disabled={!!loading}
            activeOpacity={0.85}
          >
            <Text style={s.ghostName}>{g.name}</Text>
            <Text style={s.ghostMeta}>{g._persona?.occupation || g.id}</Text>
            {loading === g.id ? <ActivityIndicator color="#C0392B" size="small" /> : (
              <Text style={s.start}>התחל ›</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function GhostBtn({ label, onPress, small }) {
  return (
    <TouchableOpacity style={[s.ghostBtn, small && s.ghostBtnSmall]} onPress={onPress} activeOpacity={0.85}>
      <Text style={s.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1E1E1E',
  },
  back: { marginRight: 8, padding: 4 },
  backText: { color: '#C0392B', fontSize: 28 },
  title: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: '800', textAlign: 'right' },
  scroll: { padding: 16, paddingBottom: 40 },
  hint: { color: '#888', fontSize: 13, lineHeight: 22, textAlign: 'right', marginBottom: 20 },
  banner: {
    backgroundColor: '#141008', borderRadius: 14, borderWidth: 1, borderColor: '#D4AF3744',
    padding: 16, marginBottom: 20,
  },
  bannerTitle: { color: '#D4AF37', fontSize: 18, fontWeight: '900', textAlign: 'right' },
  bannerSub: { color: '#CCC', fontSize: 13, textAlign: 'right', marginTop: 6 },
  bannerClock: { color: '#666', fontSize: 12, textAlign: 'right', marginTop: 4 },
  btnRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  ghostBtn: {
    backgroundColor: '#C0392B', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
  },
  ghostBtnSmall: { paddingVertical: 8, paddingHorizontal: 10 },
  ghostBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  endBtn: { marginTop: 12, alignItems: 'center' },
  endText: { color: '#666', fontSize: 13 },
  ghostRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#222',
  },
  ghostName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  ghostMeta: { color: '#666', fontSize: 11, marginTop: 2 },
  start: { color: '#C0392B', fontSize: 14, fontWeight: '700' },
});
