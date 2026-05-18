import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const ROUNDS    = 12;
const TIMEOUT_MS = 3000;

function genPair(round) {
  const mult = Math.min(1 + Math.floor(round / 3), 10);
  const a = (Math.floor(Math.random() * 20) + 1) * 500 * mult;
  let b;
  do { b = (Math.floor(Math.random() * 20) + 1) * 500 * mult; } while (b === a);
  return { left: a, right: b, bigger: a > b ? 'left' : 'right' };
}

export default function ScaleGame({ onFinish }) {
  const [status,   setStatus]   = useState('idle');
  const [round,    setRound]    = useState(0);
  const [pair,     setPair]     = useState(null);
  const [flash,    setFlash]    = useState(null);
  const [score,    setScore]    = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);

  const roundRef  = useRef(0);
  const scoreRef  = useRef(0);
  const statusRef = useRef('idle');
  const timerRef  = useRef(null);
  const tickRef   = useRef(null);
  const startT    = useRef(0);
  const startRoundRef = useRef(null);

  const win = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current * 8), 800);
  }, [onFinish]);

  function startRound(r) {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    const p = genPair(r);
    roundRef.current = r;
    setRound(r); setPair(p); setFlash(null); setTimeLeft(100);
    startT.current = Date.now();

    tickRef.current = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - startT.current) / TIMEOUT_MS) * 100);
      setTimeLeft(pct);
    }, 50);

    timerRef.current = setTimeout(() => {
      if (statusRef.current !== 'running') return;
      clearInterval(tickRef.current);
      setFlash('miss');
      timerRef.current = setTimeout(() => {
        const nr = roundRef.current + 1;
        if (nr >= ROUNDS) { win(); return; }
        startRoundRef.current(nr);
      }, 600);
    }, TIMEOUT_MS);
  }
  startRoundRef.current = startRound;

  const pick = useCallback((side) => {
    if (statusRef.current !== 'running' || !pair) return;
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    if (side === pair.bigger) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
    } else {
      setFlash('miss');
    }
    timerRef.current = setTimeout(() => {
      const nr = roundRef.current + 1;
      if (nr >= ROUNDS) { win(); return; }
      startRoundRef.current(nr);
    }, 600);
  }, [pair, win]);

  const startGame = () => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    scoreRef.current  = 0;
    statusRef.current = 'running';
    setScore(0); setFlash(null);
    setStatus('running');
    startRoundRef.current(0);
  };

  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(tickRef.current); }, []);

  const barColor = timeLeft > 60 ? '#2ECC71' : timeLeft > 30 ? '#F39C12' : '#E74C3C';
  const borderColor = flash === 'hit' ? '#2ECC71' : flash === 'miss' ? '#E74C3C' : '#1A1A2A';

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>⚖️ {round + 1} / {ROUNDS}</Text>
          <Text style={s.pts}>⭐ {score} נכונות</Text>
        </View>
      )}

      <View style={[s.game, { borderColor }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060A10' }]} />

        {status === 'running' && pair && (
          <View style={s.inner}>
            <View style={s.timerTrack}>
              <View style={[s.timerBar, { width: `${timeLeft}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={s.label}>הקש על הסכום הגדול יותר</Text>
            <View style={s.scaleRow}>
              <TouchableOpacity onPress={() => pick('left')} style={[s.scaleSide, flash === 'hit' && pair.bigger === 'left' && s.sideHit, flash === 'miss' && pair.bigger === 'right' && s.sideMiss]} activeOpacity={0.7}>
                <Text style={s.scaleAmount}>₪{pair.left.toLocaleString()}</Text>
              </TouchableOpacity>
              <Text style={s.vs}>VS</Text>
              <TouchableOpacity onPress={() => pick('right')} style={[s.scaleSide, flash === 'hit' && pair.bigger === 'right' && s.sideHit, flash === 'miss' && pair.bigger === 'left' && s.sideMiss]} activeOpacity={0.7}>
                <Text style={s.scaleAmount}>₪{pair.right.toLocaleString()}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>⚖️</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'מאזניים' : 'נסה שוב!'}</Text>
            <Text style={s.overlayHint}>{`הקש על הסכום הגדול יותר\n${ROUNDS} סיבובים מהירים`}</Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'שחק שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>מדויק!</Text>
            <Text style={s.overlayHint}>{score} / {ROUNDS} נכונות!</Text>
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
  label:     { color: '#888', fontSize: 13, fontWeight: '700' },
  timerTrack: { width: '100%', height: 6, backgroundColor: '#1A1A2A', borderRadius: 3, overflow: 'hidden' },
  timerBar:   { height: '100%', borderRadius: 3 },
  scaleRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  scaleSide: { flex: 1, borderRadius: 16, backgroundColor: '#111830', borderWidth: 2, borderColor: '#2A2A5A', paddingVertical: 24, alignItems: 'center' },
  sideHit:   { borderColor: '#2ECC71', backgroundColor: '#0A2A0A' },
  sideMiss:  { borderColor: '#E74C3C', backgroundColor: '#2A0A0A' },
  scaleAmount: { color: '#D4AF37', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  vs:        { color: '#444', fontSize: 16, fontWeight: '900' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
