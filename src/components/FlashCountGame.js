import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const ROUNDS   = 12;
const FLASH_MS = 800;

function genCoins(round) {
  const max = Math.min(4 + Math.floor(round / 3), 9);
  const count = Math.floor(Math.random() * (max - 2)) + 3;
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      x: Math.floor(Math.random() * 80) + 10,
      y: Math.floor(Math.random() * 60) + 20,
    });
  }
  const delta = Math.floor(Math.random() * 2) + 1;
  const sign  = Math.random() > 0.5 ? 1 : -1;
  const choices = [count, count + delta * sign, count - delta * sign]
    .map(v => Math.max(1, v))
    .sort(() => Math.random() - 0.5);
  return { count, positions, choices };
}

export default function FlashCountGame({ onFinish }) {
  const [status,  setStatus]  = useState('idle');
  const [round,   setRound]   = useState(0);
  const [coins,   setCoins]   = useState(null);
  const [phase,   setPhase]   = useState('flash'); // flash | answer
  const [flash,   setFlash]   = useState(null);
  const [score,   setScore]   = useState(0);

  const roundRef  = useRef(0);
  const scoreRef  = useRef(0);
  const statusRef = useRef('idle');
  const timerRef  = useRef(null);
  const startRoundRef = useRef(null);

  const win = useCallback(() => {
    clearTimeout(timerRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current * 7), 800);
  }, [onFinish]);

  function startRound(r) {
    clearTimeout(timerRef.current);
    const c = genCoins(r);
    roundRef.current = r;
    setRound(r); setCoins(c); setPhase('flash'); setFlash(null);

    timerRef.current = setTimeout(() => {
      if (statusRef.current !== 'running') return;
      setPhase('answer');
    }, FLASH_MS);
  }
  startRoundRef.current = startRound;

  const answer = useCallback((val) => {
    if (statusRef.current !== 'running' || !coins) return;
    if (val === coins.count) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
    } else {
      setFlash('miss');
    }
    timerRef.current = setTimeout(() => {
      if (statusRef.current !== 'running') return;
      setFlash(null);
      const nr = roundRef.current + 1;
      if (nr >= ROUNDS) { win(); return; }
      startRoundRef.current(nr);
    }, 600);
  }, [coins, win]);

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
          <Text style={s.scoreText}>💰 {round + 1} / {ROUNDS}</Text>
          <Text style={s.pts}>⭐ {score} נכונות</Text>
        </View>
      )}

      <View style={[s.game, { borderColor }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060A10' }]} />

        {status === 'running' && coins && (
          <View style={s.inner}>
            {phase === 'flash' && (
              <View style={s.flashArea}>
                {coins.positions.map((p, i) => (
                  <Text key={i} style={[s.coin, { left: `${p.x}%`, top: `${p.y}%` }]}>💰</Text>
                ))}
              </View>
            )}

            {phase === 'answer' && !flash && (
              <>
                <Text style={s.label}>כמה מטבעות היו?</Text>
                <View style={s.choicesRow}>
                  {coins.choices.map((c, i) => (
                    <TouchableOpacity key={i} onPress={() => answer(c)} style={s.choiceBtn} activeOpacity={0.7}>
                      <Text style={s.choiceText}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {flash && (
              <Text style={[s.flashText, { color: flash === 'hit' ? '#2ECC71' : '#E74C3C' }]}>
                {flash === 'hit' ? '✅ נכון!' : `❌ היו ${coins.count}`}
              </Text>
            )}
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>💰</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'ספור מהיר' : 'נסה שוב!'}</Text>
            <Text style={s.overlayHint}>{`מטבעות מבזיקים לשנייה\nספור — ואז ענה\n${ROUNDS} סיבובים`}</Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'שחק שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>עין חדה!</Text>
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
  inner:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 20 },
  flashArea: { width: '100%', height: 180, position: 'relative' },
  coin:      { position: 'absolute', fontSize: 28 },
  label:     { color: '#888', fontSize: 15, fontWeight: '700' },
  choicesRow:{ flexDirection: 'row', gap: 16 },
  choiceBtn: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#111830', borderWidth: 2, borderColor: '#2A2A5A', alignItems: 'center', justifyContent: 'center' },
  choiceText:{ color: '#D4AF37', fontSize: 28, fontWeight: '900' },
  flashText: { fontSize: 24, fontWeight: '900' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
