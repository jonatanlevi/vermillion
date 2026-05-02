import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 290;
const WIN_COUNT = 15;
const MAX_MISS  = 3;
const TIMEOUT_MS = 2400;

const ITEMS = [
  { label: '💼 משכורת',      category: 'income'  },
  { label: '🎁 בונוס',       category: 'income'  },
  { label: '📈 תשואה',       category: 'income'  },
  { label: '💰 הכנסה נוספת', category: 'income'  },
  { label: '🏠 שכירות',      category: 'expense' },
  { label: '🛒 קניות',       category: 'expense' },
  { label: '⛽ דלק',         category: 'expense' },
  { label: '💳 כרטיס אשראי', category: 'expense' },
  { label: '🍔 אוכל',        category: 'expense' },
  { label: '📱 סלולרי',      category: 'expense' },
];

export default function SortGame({ onFinish }) {
  const [status, setStatus]     = useState('idle');
  const [score, setScore]       = useState(0);
  const [misses, setMisses]     = useState(0);
  const [current, setCurrent]   = useState(null);
  const [flash, setFlash]       = useState(null);
  const [timeLeft, setTimeLeft] = useState(100);

  const scoreRef   = useRef(0);
  const missRef    = useRef(0);
  const statusRef  = useRef('idle');
  const timerRef   = useRef(null);
  const tickRef    = useRef(null);
  const startTime  = useRef(0);

  const die = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    statusRef.current = 'dead';
    setStatus('dead');
    setCurrent(null);
  }, []);

  const win = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setCurrent(null);
    setTimeout(() => onFinish(scoreRef.current), 800);
  }, [onFinish]);

  const nextItem = useCallback(() => {
    if (statusRef.current !== 'running') return;
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    setCurrent(item);
    setTimeLeft(100);
    startTime.current = Date.now();

    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      setTimeLeft(Math.max(0, 100 - (elapsed / TIMEOUT_MS) * 100));
    }, 50);

    timerRef.current = setTimeout(() => {
      if (statusRef.current !== 'running') return;
      missRef.current += 1;
      setMisses(missRef.current);
      setFlash('timeout');
      setTimeout(() => setFlash(null), 300);
      if (missRef.current >= MAX_MISS) { die(); return; }
      nextItem();
    }, TIMEOUT_MS);
  }, [die]);

  const sort = useCallback((category) => {
    if (statusRef.current !== 'running' || !current) return;
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);

    if (category === current.category) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
      setTimeout(() => setFlash(null), 250);
      if (scoreRef.current >= WIN_COUNT) { win(); return; }
    } else {
      missRef.current += 1;
      setMisses(missRef.current);
      setFlash('miss');
      setTimeout(() => setFlash(null), 250);
      if (missRef.current >= MAX_MISS) { die(); return; }
    }
    setTimeout(nextItem, 220);
  }, [current, win, die, nextItem]);

  const startGame = () => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    scoreRef.current = 0;
    missRef.current  = 0;
    statusRef.current = 'running';
    setScore(0);
    setMisses(0);
    setFlash(null);
    setCurrent(null);
    setStatus('running');
    setTimeout(nextItem, 400);
  };

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
  }, []);

  const barColor = timeLeft > 60 ? '#2ECC71' : timeLeft > 30 ? '#F39C12' : '#E74C3C';

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>🗂️ {score} / {WIN_COUNT}</Text>
          <View style={s.livesRow}>
            {[...Array(MAX_MISS)].map((_, i) => (
              <Text key={i} style={{ fontSize: 16, opacity: i < (MAX_MISS - misses) ? 1 : 0.15 }}>❤️</Text>
            ))}
          </View>
        </View>
      )}

      <View style={[s.game, flash === 'hit' && s.gameHit, flash === 'miss' && s.gameMiss, flash === 'timeout' && s.gameMiss]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080C14' }]} />

        {status === 'running' && current && (
          <View style={s.inner}>
            {/* Timer bar */}
            <View style={s.timerTrack}>
              <View style={[s.timerBar, { width: `${timeLeft}%`, backgroundColor: barColor }]} />
            </View>

            {/* Item */}
            <View style={[s.itemCard, flash === 'hit' && s.itemHit, flash === 'miss' && s.itemMiss]}>
              <Text style={s.itemLabel}>{current.label}</Text>
            </View>

            {/* Sort buttons */}
            <View style={s.btnRow}>
              <TouchableOpacity onPress={() => sort('income')} style={[s.sortBtn, s.incomeBtn]} activeOpacity={0.75}>
                <Text style={s.sortIcon}>📥</Text>
                <Text style={s.sortLabel}>הכנסה</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => sort('expense')} style={[s.sortBtn, s.expenseBtn]} activeOpacity={0.75}>
                <Text style={s.sortIcon}>📤</Text>
                <Text style={s.sortLabel}>הוצאה</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🗂️</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'מיין את הכסף' : 'פספסת יותר מדי!'}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `הכנסה 📥 או הוצאה 📤?\nמהר — יש מגבלת זמן!\n${WIN_COUNT} מיונים נכונים לניצחון`
                : `מיינת ${score} נכון`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>כל הכבוד!</Text>
            <Text style={s.overlayHint}>מיינת {WIN_COUNT} פריטים נכון!</Text>
            <Text style={s.overlayNote}>ממשיך...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { width: W, alignSelf: 'center' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  livesRow: { flexDirection: 'row', gap: 4 },
  game: { width: W, height: H, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: '#1A1A2A', position: 'relative' },
  gameHit:  { borderColor: '#2ECC71' },
  gameMiss: { borderColor: '#E74C3C' },

  inner: { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 16 },
  timerTrack: { width: '100%', height: 6, backgroundColor: '#1A1A2A', borderRadius: 3, overflow: 'hidden' },
  timerBar: { height: '100%', borderRadius: 3 },

  itemCard: {
    width: W - 64, paddingVertical: 20, paddingHorizontal: 16,
    backgroundColor: '#111', borderRadius: 16, borderWidth: 2, borderColor: '#2A2A4A',
    alignItems: 'center',
  },
  itemHit:  { borderColor: '#2ECC71', backgroundColor: '#2ECC7111' },
  itemMiss: { borderColor: '#E74C3C', backgroundColor: '#E74C3C11' },
  itemLabel: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center' },

  btnRow: { flexDirection: 'row', gap: 16, width: '100%' },
  sortBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 2, alignItems: 'center', gap: 4 },
  incomeBtn:  { backgroundColor: '#2ECC7122', borderColor: '#2ECC71' },
  expenseBtn: { backgroundColor: '#E74C3C22', borderColor: '#E74C3C' },
  sortIcon:  { fontSize: 24 },
  sortLabel: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote: { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn: { marginTop: 8, backgroundColor: 'rgba(192,57,43,0.20)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(192,57,43,0.50)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
