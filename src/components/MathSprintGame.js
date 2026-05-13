import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const WIN_COUNT  = 10;
const MAX_WRONG  = 3;
const TIMEOUT_MS = 4000;

function genQ(score) {
  const mult = Math.min(1 + Math.floor(score / 3), 5);
  const a = (Math.floor(Math.random() * 10) + 1) * 100 * mult;
  const b = (Math.floor(Math.random() * 8)  + 1) * 100;
  const add = Math.random() > 0.4;
  const [x, y] = add ? [a, b] : [Math.max(a, b), Math.min(a, b)];
  const correct = add ? x + y : x - y;
  const delta   = (Math.floor(Math.random() * 3) + 1) * 100;
  const choices = [correct, correct + delta, correct - delta].sort(() => Math.random() - 0.5);
  return { x, y, op: add ? '+' : '-', correct, choices };
}

export default function MathSprintGame({ onFinish }) {
  const [status, setStatus]     = useState('idle');
  const [score,  setScore]      = useState(0);
  const [wrong,  setWrong]      = useState(0);
  const [q,      setQ]          = useState(null);
  const [flash,  setFlash]      = useState(null);
  const [timeLeft, setTimeLeft] = useState(100);

  const scoreRef  = useRef(0);
  const wrongRef  = useRef(0);
  const statusRef = useRef('idle');
  const timerRef  = useRef(null);
  const tickRef   = useRef(null);
  const startT    = useRef(0);

  const die = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    statusRef.current = 'dead';
    setStatus('dead');
  }, []);

  const win = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current * 10), 800);
  }, [onFinish]);

  const nextQ = useCallback(() => {
    if (statusRef.current !== 'running') return;
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    setQ(genQ(scoreRef.current));
    setTimeLeft(100);
    startT.current = Date.now();

    tickRef.current = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - startT.current) / TIMEOUT_MS) * 100);
      setTimeLeft(pct);
    }, 50);

    timerRef.current = setTimeout(() => {
      if (statusRef.current !== 'running') return;
      wrongRef.current += 1;
      setWrong(wrongRef.current);
      setFlash('wrong');
      setTimeout(() => setFlash(null), 300);
      if (wrongRef.current >= MAX_WRONG) { die(); return; }
      setTimeout(nextQ, 350);
    }, TIMEOUT_MS);
  }, [die]);

  const answer = useCallback((val) => {
    if (statusRef.current !== 'running' || !q) return;
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    if (val === q.correct) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
      setTimeout(() => setFlash(null), 250);
      if (scoreRef.current >= WIN_COUNT) { win(); return; }
    } else {
      wrongRef.current += 1;
      setWrong(wrongRef.current);
      setFlash('wrong');
      setTimeout(() => setFlash(null), 300);
      if (wrongRef.current >= MAX_WRONG) { die(); return; }
    }
    setTimeout(nextQ, 320);
  }, [q, win, die, nextQ]);

  const startGame = () => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    scoreRef.current = 0;
    wrongRef.current = 0;
    statusRef.current = 'running';
    setScore(0); setWrong(0); setFlash(null);
    setStatus('running');
    setTimeout(nextQ, 400);
  };

  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(tickRef.current); }, []);

  const barColor = timeLeft > 60 ? '#2ECC71' : timeLeft > 30 ? '#F39C12' : '#E74C3C';

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>🧮 {score} / {WIN_COUNT}</Text>
          <View style={s.livesRow}>
            {[...Array(MAX_WRONG)].map((_, i) => (
              <Text key={i} style={{ fontSize: 16, opacity: i < MAX_WRONG - wrong ? 1 : 0.15 }}>❤️</Text>
            ))}
          </View>
        </View>
      )}

      <View style={[s.game, flash === 'hit' && s.gameHit, flash === 'wrong' && s.gameMiss]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080C14' }]} />

        {status === 'running' && q && (
          <View style={s.inner}>
            <View style={s.timerTrack}>
              <View style={[s.timerBar, { width: `${timeLeft}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={s.question}>
              ₪{q.x.toLocaleString()} {q.op} ₪{q.y.toLocaleString()} = ?
            </Text>
            <View style={s.choicesWrap}>
              {q.choices.map((c, i) => (
                <TouchableOpacity key={i} onPress={() => answer(c)} style={s.choiceBtn} activeOpacity={0.7}>
                  <Text style={s.choiceText}>₪{c.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🧮</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'חשבון מהיר' : 'פספסת יותר מדי!'}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `חשב ₪ מהר!\n4 שניות לתשובה\n${WIN_COUNT} נכונות לניצחון`
                : `ענית נכון ${score} פעמים`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>מתמטיקאי!</Text>
            <Text style={s.overlayHint}>{WIN_COUNT} תשובות נכונות!</Text>
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
  scoreText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  livesRow:  { flexDirection: 'row', gap: 4 },
  game:      { width: W, height: H, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: '#1A1A2A', position: 'relative' },
  gameHit:   { borderColor: '#2ECC71' },
  gameMiss:  { borderColor: '#E74C3C' },
  inner:     { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 16 },
  timerTrack: { width: '100%', height: 6, backgroundColor: '#1A1A2A', borderRadius: 3, overflow: 'hidden' },
  timerBar:   { height: '100%', borderRadius: 3 },
  question:   { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  choicesWrap:{ width: '100%', gap: 10 },
  choiceBtn:  { backgroundColor: '#111830', borderRadius: 14, borderWidth: 1, borderColor: '#2A2A5A', paddingVertical: 14, alignItems: 'center' },
  choiceText: { color: '#D4AF37', fontSize: 20, fontWeight: '900' },
  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
