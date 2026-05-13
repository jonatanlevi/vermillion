import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const WIN_COUNT  = 20;
const MAX_WRONG  = 3;
const TIMEOUT_MS = 2500;

const WORDS = [
  { word: 'הכנסה',    positive: true  },
  { word: 'חיסכון',   positive: true  },
  { word: 'רווח',     positive: true  },
  { word: 'השקעה',    positive: true  },
  { word: 'נכס',      positive: true  },
  { word: 'דיבידנד',  positive: true  },
  { word: 'ריבית מצטברת', positive: true },
  { word: 'תשואה',    positive: true  },
  { word: 'עצמאות כלכלית', positive: true },
  { word: 'תקציב',    positive: true  },
  { word: 'חוב',      positive: false },
  { word: 'הוצאה',    positive: false },
  { word: 'ריבית',    positive: false },
  { word: 'הפסד',     positive: false },
  { word: 'התחייבות', positive: false },
  { word: 'עיקול',    positive: false },
  { word: 'פשיטת רגל', positive: false },
  { word: 'גירעון',   positive: false },
  { word: 'קנס',      positive: false },
  { word: 'בזבוז',    positive: false },
];

function pickWord(used) {
  const available = WORDS.filter(w => !used.has(w.word));
  if (available.length === 0) return WORDS[Math.floor(Math.random() * WORDS.length)];
  return available[Math.floor(Math.random() * available.length)];
}

export default function WordSnapGame({ onFinish }) {
  const [status,   setStatus]   = useState('idle');
  const [score,    setScore]    = useState(0);
  const [wrong,    setWrong]    = useState(0);
  const [word,     setWord]     = useState(null);
  const [flash,    setFlash]    = useState(null);
  const [timeLeft, setTimeLeft] = useState(100);

  const scoreRef  = useRef(0);
  const wrongRef  = useRef(0);
  const statusRef = useRef('idle');
  const timerRef  = useRef(null);
  const tickRef   = useRef(null);
  const startT    = useRef(0);
  const usedRef   = useRef(new Set());

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
    setTimeout(() => onFinish(scoreRef.current * 5), 800);
  }, [onFinish]);

  const nextWord = useCallback(() => {
    if (statusRef.current !== 'running') return;
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);

    const w = pickWord(usedRef.current);
    usedRef.current.add(w.word);
    if (usedRef.current.size >= WORDS.length) usedRef.current.clear();

    setWord(w);
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
      setTimeout(nextWord, 350);
    }, TIMEOUT_MS);
  }, [die]);

  const answer = useCallback((isPositive) => {
    if (statusRef.current !== 'running' || !word) return;
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);

    if (isPositive === word.positive) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
      setTimeout(() => setFlash(null), 200);
      if (scoreRef.current >= WIN_COUNT) { win(); return; }
    } else {
      wrongRef.current += 1;
      setWrong(wrongRef.current);
      setFlash('wrong');
      setTimeout(() => setFlash(null), 300);
      if (wrongRef.current >= MAX_WRONG) { die(); return; }
    }
    setTimeout(nextWord, 280);
  }, [word, win, die, nextWord]);

  const startGame = () => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    scoreRef.current = 0;
    wrongRef.current = 0;
    statusRef.current = 'running';
    usedRef.current.clear();
    setScore(0); setWrong(0); setFlash(null);
    setStatus('running');
    setTimeout(nextWord, 400);
  };

  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(tickRef.current); }, []);

  const barColor = timeLeft > 60 ? '#2ECC71' : timeLeft > 30 ? '#F39C12' : '#E74C3C';

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>📝 {score} / {WIN_COUNT}</Text>
          <View style={s.livesRow}>
            {[...Array(MAX_WRONG)].map((_, i) => (
              <Text key={i} style={{ fontSize: 16, opacity: i < MAX_WRONG - wrong ? 1 : 0.15 }}>❤️</Text>
            ))}
          </View>
        </View>
      )}

      <View style={[s.game, flash === 'hit' && s.gameHit, flash === 'wrong' && s.gameMiss]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080C14' }]} />

        {status === 'running' && word && (
          <View style={s.inner}>
            <View style={s.timerTrack}>
              <View style={[s.timerBar, { width: `${timeLeft}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={s.wordText}>{word.word}</Text>
            <View style={s.btnRow}>
              <TouchableOpacity onPress={() => answer(false)} style={[s.snapBtn, s.negBtn]} activeOpacity={0.7}>
                <Text style={s.snapIcon}>❌</Text>
                <Text style={s.snapLabel}>שלילי</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => answer(true)} style={[s.snapBtn, s.posBtn]} activeOpacity={0.7}>
                <Text style={s.snapIcon}>✅</Text>
                <Text style={s.snapLabel}>חיובי</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>📝</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'חיובי / שלילי' : 'פספסת יותר מדי!'}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `מילה פיננסית מופיעה\nסמן: חיובי ✅ או שלילי ❌\n${WIN_COUNT} נכונות לניצחון`
                : `ענית נכון ${score} פעמים`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>מצויין!</Text>
            <Text style={s.overlayHint}>{WIN_COUNT} מילים נכונות!</Text>
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
  inner:     { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 20 },
  timerTrack: { width: '100%', height: 6, backgroundColor: '#1A1A2A', borderRadius: 3, overflow: 'hidden' },
  timerBar:   { height: '100%', borderRadius: 3 },
  wordText:   { color: '#FFF', fontSize: 36, fontWeight: '900', textAlign: 'center', letterSpacing: 2 },
  btnRow:     { flexDirection: 'row', gap: 20, width: '100%' },
  snapBtn:    { flex: 1, borderRadius: 16, paddingVertical: 18, alignItems: 'center', gap: 4 },
  negBtn:     { backgroundColor: 'rgba(231,76,60,0.2)', borderWidth: 2, borderColor: '#E74C3C' },
  posBtn:     { backgroundColor: 'rgba(46,204,113,0.2)', borderWidth: 2, borderColor: '#2ECC71' },
  snapIcon:   { fontSize: 24 },
  snapLabel:  { color: '#FFF', fontSize: 14, fontWeight: '800' },
  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
