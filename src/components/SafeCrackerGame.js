import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const ROUNDS    = 6;
const BASE_SPEED = 80;

export default function SafeCrackerGame({ onFinish }) {
  const [status,   setStatus]   = useState('idle');
  const [round,    setRound]    = useState(0);
  const [target,   setTarget]   = useState(0);
  const [current,  setCurrent]  = useState(0);
  const [flash,    setFlash]    = useState(null);
  const [score,    setScore]    = useState(0);

  const roundRef   = useRef(0);
  const currentRef = useRef(0);
  const scoreRef   = useRef(0);
  const statusRef  = useRef('idle');
  const tickRef    = useRef(null);
  const targetRef  = useRef(0);
  const timerRef   = useRef(null);

  const win = useCallback(() => {
    clearInterval(tickRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current * 15), 800);
  }, [onFinish]);

  const startRoundRef = useRef(null);

  function startRound(r) {
    clearInterval(tickRef.current);
    clearTimeout(timerRef.current);
    const t = Math.floor(Math.random() * 88) + 6;
    targetRef.current  = t;
    roundRef.current   = r;
    currentRef.current = 0;
    setTarget(t); setRound(r); setCurrent(0); setFlash(null);

    const speed = Math.max(20, BASE_SPEED - r * 10);
    tickRef.current = setInterval(() => {
      currentRef.current = (currentRef.current + 1) % 100;
      setCurrent(currentRef.current);
    }, speed);
  }
  startRoundRef.current = startRound;

  const stop = useCallback(() => {
    if (statusRef.current !== 'running') return;
    clearInterval(tickRef.current);
    const diff = Math.abs(currentRef.current - targetRef.current);
    const minDiff = Math.min(diff, 100 - diff);
    let pts = 0, f = 'miss';
    if (minDiff <= 2) { pts = 3; f = 'hit'; }
    else if (minDiff <= 6) { pts = 1; f = 'near'; }
    scoreRef.current += pts;
    setScore(scoreRef.current);
    setFlash(f);

    timerRef.current = setTimeout(() => {
      if (statusRef.current !== 'running') return;
      setFlash(null);
      const next = roundRef.current + 1;
      if (next >= ROUNDS) { win(); return; }
      startRoundRef.current(next);
    }, 800);
  }, [win]);

  const startGame = () => {
    clearInterval(tickRef.current);
    clearTimeout(timerRef.current);
    scoreRef.current  = 0;
    statusRef.current = 'running';
    setScore(0); setFlash(null);
    setStatus('running');
    startRoundRef.current(0);
  };

  useEffect(() => () => { clearInterval(tickRef.current); clearTimeout(timerRef.current); }, []);

  const borderColor = flash === 'hit' ? '#2ECC71' : flash === 'near' ? '#F39C12' : flash === 'miss' ? '#E74C3C' : '#1A1A2A';

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>🔐 {round + 1} / {ROUNDS}</Text>
          <Text style={s.pts}>⭐ {score} נק׳</Text>
        </View>
      )}

      <View style={[s.game, { borderColor }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060A10' }]} />

        {status === 'running' && (
          <View style={s.inner}>
            <Text style={s.label}>עצור על</Text>
            <Text style={s.targetNum}>{String(target).padStart(2, '0')}</Text>

            <View style={[s.dialBox, { borderColor: flash ? borderColor : '#2A2A5A', shadowColor: flash ? borderColor : '#000' }]}>
              <Text style={s.dialNum}>{String(current).padStart(2, '0')}</Text>
              {flash && (
                <Text style={s.flashLabel}>
                  {flash === 'hit' ? '🎯 מדויק!' : flash === 'near' ? '👍 קרוב' : '❌ מחטיא'}
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={stop} style={s.stopBtn} activeOpacity={0.8}>
              <Text style={s.stopBtnText}>⛔ עצור</Text>
            </TouchableOpacity>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🔐</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'פצח את הכספת' : 'כספת נעולה!'}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `עצור את הספרה על המטרה\n${ROUNDS} סיבובים — מהר עם כל סיבוב`
                : `צברת ${score} נקודות`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>כספת פתוחה!</Text>
            <Text style={s.overlayHint}>{ROUNDS} סיבובים — {score} נקודות!</Text>
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
  inner:     { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 20 },
  label:     { color: '#888', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  targetNum: { color: '#D4AF37', fontSize: 52, fontWeight: '900', letterSpacing: 8 },
  dialBox:   {
    width: 140, height: 100, borderRadius: 20,
    backgroundColor: '#111830', borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 16, elevation: 8,
  },
  dialNum:    { color: '#FFF', fontSize: 48, fontWeight: '900' },
  flashLabel: { color: '#FFF', fontSize: 13, fontWeight: '700', marginTop: 4 },
  stopBtn:    { backgroundColor: '#C0392B', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48, shadowColor: '#C0392B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  stopBtnText:{ color: '#FFF', fontSize: 18, fontWeight: '900' },
  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
