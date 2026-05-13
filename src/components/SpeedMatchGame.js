import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const WIN_COUNT  = 20;
const MAX_WRONG  = 3;
const TIMEOUT_MS = 2000;

const POSITIVE = ['הכנסה','חיסכון','רווח','השקעה','נכס','תשואה','דיבידנד','תקציב','עצמאות'];
const NEGATIVE = ['חוב','הוצאה','ריבית','הפסד','גירעון','בזבוז','קנס','עיקול'];

function genPair() {
  const sameCategory = Math.random() > 0.5;
  if (sameCategory) {
    const pool = Math.random() > 0.5 ? POSITIVE : NEGATIVE;
    const [i, j] = [0, 1].map(() => Math.floor(Math.random() * pool.length));
    return { a: pool[i], b: pool[j === i ? (j + 1) % pool.length : j], same: true };
  } else {
    const a = POSITIVE[Math.floor(Math.random() * POSITIVE.length)];
    const b = NEGATIVE[Math.floor(Math.random() * NEGATIVE.length)];
    return Math.random() > 0.5 ? { a, b, same: false } : { a: b, b: a, same: false };
  }
}

export default function SpeedMatchGame({ onFinish }) {
  const [status,   setStatus]   = useState('idle');
  const [score,    setScore]    = useState(0);
  const [wrong,    setWrong]    = useState(0);
  const [pair,     setPair]     = useState(null);
  const [flash,    setFlash]    = useState(null);
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
    setTimeout(() => onFinish(scoreRef.current * 5), 800);
  }, [onFinish]);

  const nextPair = useCallback(() => {
    if (statusRef.current !== 'running') return;
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    setPair(genPair());
    setTimeLeft(100);
    startT.current = Date.now();

    tickRef.current = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - startT.current) / TIMEOUT_MS) * 100);
      setTimeLeft(pct);
    }, 40);

    timerRef.current = setTimeout(() => {
      if (statusRef.current !== 'running') return;
      wrongRef.current += 1;
      setWrong(wrongRef.current);
      setFlash('wrong');
      setTimeout(() => setFlash(null), 250);
      if (wrongRef.current >= MAX_WRONG) { die(); return; }
      setTimeout(nextPair, 300);
    }, TIMEOUT_MS);
  }, [die]);

  const answer = useCallback((isSame) => {
    if (statusRef.current !== 'running' || !pair) return;
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);

    if (isSame === pair.same) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
      setTimeout(() => setFlash(null), 200);
      if (scoreRef.current >= WIN_COUNT) { win(); return; }
    } else {
      wrongRef.current += 1;
      setWrong(wrongRef.current);
      setFlash('wrong');
      setTimeout(() => setFlash(null), 250);
      if (wrongRef.current >= MAX_WRONG) { die(); return; }
    }
    setTimeout(nextPair, 280);
  }, [pair, win, die, nextPair]);

  const startGame = () => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    scoreRef.current = 0;
    wrongRef.current = 0;
    statusRef.current = 'running';
    setScore(0); setWrong(0); setFlash(null);
    setStatus('running');
    setTimeout(nextPair, 400);
  };

  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(tickRef.current); }, []);

  const barColor = timeLeft > 60 ? '#2ECC71' : timeLeft > 30 ? '#F39C12' : '#E74C3C';

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>🔀 {score} / {WIN_COUNT}</Text>
          <View style={s.livesRow}>
            {[...Array(MAX_WRONG)].map((_, i) => (
              <Text key={i} style={{ fontSize: 16, opacity: i < MAX_WRONG - wrong ? 1 : 0.15 }}>❤️</Text>
            ))}
          </View>
        </View>
      )}

      <View style={[s.game, flash === 'hit' && s.gameHit, flash === 'wrong' && s.gameMiss]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080C14' }]} />

        {status === 'running' && pair && (
          <View style={s.inner}>
            <View style={s.timerTrack}>
              <View style={[s.timerBar, { width: `${timeLeft}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={s.label}>אותה קטגוריה?</Text>
            <View style={s.pairRow}>
              <View style={s.wordBox}><Text style={s.wordText}>{pair.a}</Text></View>
              <Text style={s.vs}>↔</Text>
              <View style={s.wordBox}><Text style={s.wordText}>{pair.b}</Text></View>
            </View>
            <View style={s.btnRow}>
              <TouchableOpacity onPress={() => answer(false)} style={[s.ansBtn, s.noBtn]} activeOpacity={0.7}>
                <Text style={s.ansBtnText}>❌ שונה</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => answer(true)} style={[s.ansBtn, s.yesBtn]} activeOpacity={0.7}>
                <Text style={s.ansBtnText}>✅ זהה</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🔀</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'התאמה מהירה' : 'פספסת יותר מדי!'}</Text>
            <Text style={s.overlayHint}>{`שני מושגים פיננסיים\nאותה קטגוריה? כן / לא\n${WIN_COUNT} נכונות לניצחון`}</Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>מומחה!</Text>
            <Text style={s.overlayHint}>{WIN_COUNT} התאמות נכונות!</Text>
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
  label:     { color: '#888', fontSize: 13, fontWeight: '700' },
  pairRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  wordBox:   { flex: 1, backgroundColor: '#111830', borderRadius: 14, borderWidth: 1, borderColor: '#2A2A5A', paddingVertical: 16, alignItems: 'center' },
  wordText:  { color: '#FFF', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  vs:        { color: '#444', fontSize: 20, fontWeight: '900' },
  btnRow:    { flexDirection: 'row', gap: 14, width: '100%' },
  ansBtn:    { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 2 },
  noBtn:     { backgroundColor: 'rgba(231,76,60,0.15)', borderColor: '#E74C3C' },
  yesBtn:    { backgroundColor: 'rgba(46,204,113,0.15)', borderColor: '#2ECC71' },
  ansBtnText:{ color: '#FFF', fontSize: 15, fontWeight: '800' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
