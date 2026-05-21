import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const ROUNDS    = 8;
const GRID_SIZE = 6;

function genAmounts() {
  const base = (Math.floor(Math.random() * 8) + 1) * 1000;
  const steps = new Set();
  while (steps.size < GRID_SIZE) {
    steps.add(base + Math.floor(Math.random() * 20) * 500);
  }
  return [...steps].sort(() => Math.random() - 0.5).map((val, i) => ({ id: i, val }));
}

export default function TapOrderGame({ onFinish }) {
  const [status,   setStatus]   = useState('idle');
  const [round,    setRound]    = useState(0);
  const [items,    setItems]    = useState([]);
  const [nextIdx,  setNextIdx]  = useState(0);
  const [flash,    setFlash]    = useState(null);
  const [score,    setScore]    = useState(0);
  const [tapped,   setTapped]   = useState(new Set());

  const roundRef   = useRef(0);
  const nextIdxRef = useRef(0);
  const scoreRef   = useRef(0);
  const statusRef  = useRef('idle');
  const sortedRef  = useRef([]);
  const timerRef   = useRef(null);
  const tappedRef  = useRef(new Set());
  const startRoundRef = useRef(null);

  const win = useCallback(() => {
    clearTimeout(timerRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current * 12), 800);
  }, [onFinish]);

  function startRound(r) {
    clearTimeout(timerRef.current);
    const amts = genAmounts();
    sortedRef.current = [...amts].sort((a, b) => a.val - b.val);
    roundRef.current  = r;
    nextIdxRef.current = 0;
    tappedRef.current = new Set();
    setItems(amts); setRound(r); setNextIdx(0); setFlash(null); setTapped(new Set());
  }
  startRoundRef.current = startRound;

  const tapItem = useCallback((id) => {
    if (statusRef.current !== 'running') return;
    if (tappedRef.current.has(id)) return;

    const expected = sortedRef.current[nextIdxRef.current];
    if (expected.id === id) {
      tappedRef.current = new Set([...tappedRef.current, id]);
      nextIdxRef.current += 1;
      setTapped(new Set(tappedRef.current));
      setNextIdx(nextIdxRef.current);

      if (nextIdxRef.current >= GRID_SIZE) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setFlash('hit');
        timerRef.current = setTimeout(() => {
          if (statusRef.current !== 'running') return;
          setFlash(null);
          const next = roundRef.current + 1;
          if (next >= ROUNDS) { win(); return; }
          startRoundRef.current(next);
        }, 600);
      }
    } else {
      setFlash('miss');
      timerRef.current = setTimeout(() => {
        if (statusRef.current !== 'running') return;
        setFlash(null);
        startRoundRef.current(roundRef.current);
      }, 700);
    }
  }, [win]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const startGame = () => {
    clearTimeout(timerRef.current);
    scoreRef.current  = 0;
    statusRef.current = 'running';
    setScore(0); setFlash(null);
    setStatus('running');
    startRoundRef.current(0);
  };

  const borderColor = flash === 'hit' ? '#2ECC71' : flash === 'miss' ? '#E74C3C' : '#1A1A2A';

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>📊 {round + 1} / {ROUNDS}</Text>
          <Text style={s.pts}>⭐ {score} נכונות</Text>
        </View>
      )}

      <View style={[s.game, { borderColor }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060A10' }]} />

        {status === 'running' && items.length > 0 && (
          <View style={s.inner}>
            <Text style={s.label}>הקש מהנמוך לגבוה ←</Text>
            <View style={s.grid}>
              {items.map(item => {
                const done = tappedRef.current.has(item.id);
                const isNext = sortedRef.current[nextIdxRef.current]?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => tapItem(item.id)}
                    activeOpacity={0.7}
                    style={[s.tile, done && s.tileDone, isNext && !done && s.tileNext]}
                  >
                    <Text style={[s.tileText, done && s.tileTextDone]}>
                      ₪{(item.val / 1000).toFixed(0)}K
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>📊</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'סדר עולה' : 'טעות!'}</Text>
            <Text style={s.overlayHint}>
              {`הקש את סכומי ₪\nמהקטן לגדול ביותר\n${ROUNDS} סיבובים`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>מסודר!</Text>
            <Text style={s.overlayHint}>{score} / {ROUNDS} סיבובים נכונים!</Text>
            <Text style={s.overlayNote}>ממשיך...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:   { width: W, alignSelf: 'center' },
  scoreRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  pts:       { color: '#D4AF37', fontSize: 14, fontWeight: '700' },
  game:      { width: W, height: H, borderRadius: 18, overflow: 'hidden', borderWidth: 2, position: 'relative' },
  inner:     { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 16 },
  label:     { color: '#888', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, width: '100%' },
  tile:      { width: (W - 72) / 3, paddingVertical: 18, borderRadius: 14, backgroundColor: '#111830', borderWidth: 2, borderColor: '#2A2A5A', alignItems: 'center' },
  tileDone:  { backgroundColor: '#0A2A0A', borderColor: '#2ECC71' },
  tileNext:  { borderColor: '#D4AF37', backgroundColor: '#1A1A08' },
  tileText:  { color: '#D4AF37', fontSize: 17, fontWeight: '900' },
  tileTextDone: { color: '#2ECC71' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
