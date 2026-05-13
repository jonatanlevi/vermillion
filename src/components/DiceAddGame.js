import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const WIN_COUNT  = 15;
const MAX_WRONG  = 3;
const TIMEOUT_MS = 3500;

const FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

function genRoll(round) {
  const count = Math.min(2 + Math.floor(round / 4), 4);
  const dice  = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
  const sum   = dice.reduce((a, b) => a + b, 0);
  const delta = Math.floor(Math.random() * 3) + 1;
  const sign  = Math.random() > 0.5 ? 1 : -1;
  const choices = [sum, sum + delta * sign, sum - delta * sign]
    .map(v => Math.max(1, v))
    .sort(() => Math.random() - 0.5);
  return { dice, sum, choices };
}

export default function DiceAddGame({ onFinish }) {
  const [status,   setStatus]   = useState('idle');
  const [score,    setScore]    = useState(0);
  const [wrong,    setWrong]    = useState(0);
  const [roll,     setRoll]     = useState(null);
  const [flash,    setFlash]    = useState(null);
  const [timeLeft, setTimeLeft] = useState(100);

  const scoreRef  = useRef(0);
  const wrongRef  = useRef(0);
  const statusRef = useRef('idle');
  const roundRef  = useRef(0);
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
    setTimeout(() => onFinish(scoreRef.current * 6), 800);
  }, [onFinish]);

  const nextRoll = useCallback(() => {
    if (statusRef.current !== 'running') return;
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    setRoll(genRoll(roundRef.current));
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
      setTimeout(() => setFlash(null), 250);
      if (wrongRef.current >= MAX_WRONG) { die(); return; }
      roundRef.current += 1;
      setTimeout(nextRoll, 300);
    }, TIMEOUT_MS);
  }, [die]);

  const answer = useCallback((val) => {
    if (statusRef.current !== 'running' || !roll) return;
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    if (val === roll.sum) {
      scoreRef.current += 1;
      roundRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
      setTimeout(() => setFlash(null), 200);
      if (scoreRef.current >= WIN_COUNT) { win(); return; }
    } else {
      wrongRef.current += 1;
      roundRef.current += 1;
      setWrong(wrongRef.current);
      setFlash('wrong');
      setTimeout(() => setFlash(null), 250);
      if (wrongRef.current >= MAX_WRONG) { die(); return; }
    }
    setTimeout(nextRoll, 280);
  }, [roll, win, die, nextRoll]);

  const startGame = () => {
    clearTimeout(timerRef.current);
    clearInterval(tickRef.current);
    scoreRef.current  = 0;
    wrongRef.current  = 0;
    roundRef.current  = 0;
    statusRef.current = 'running';
    setScore(0); setWrong(0); setFlash(null);
    setStatus('running');
    setTimeout(nextRoll, 400);
  };

  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(tickRef.current); }, []);

  const barColor = timeLeft > 60 ? '#2ECC71' : timeLeft > 30 ? '#F39C12' : '#E74C3C';

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>🎲 {score} / {WIN_COUNT}</Text>
          <View style={s.livesRow}>
            {[...Array(MAX_WRONG)].map((_, i) => (
              <Text key={i} style={{ fontSize: 16, opacity: i < MAX_WRONG - wrong ? 1 : 0.15 }}>❤️</Text>
            ))}
          </View>
        </View>
      )}

      <View style={[s.game, flash === 'hit' && s.gameHit, flash === 'wrong' && s.gameMiss]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080C14' }]} />

        {status === 'running' && roll && (
          <View style={s.inner}>
            <View style={s.timerTrack}>
              <View style={[s.timerBar, { width: `${timeLeft}%`, backgroundColor: barColor }]} />
            </View>
            <View style={s.diceRow}>
              {roll.dice.map((d, i) => (
                <Text key={i} style={s.dieFace}>{FACES[d - 1]}</Text>
              ))}
            </View>
            <View style={s.choicesWrap}>
              {roll.choices.map((c, i) => (
                <TouchableOpacity key={i} onPress={() => answer(c)} style={s.choiceBtn} activeOpacity={0.7}>
                  <Text style={s.choiceText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🎲</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'קוביות מהיר' : 'פספסת יותר מדי!'}</Text>
            <Text style={s.overlayHint}>{`חשב סכום הקוביות מהר\n3.5 שניות לתשובה\n${WIN_COUNT} נכונות לניצחון`}</Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>חשבון מהיר!</Text>
            <Text style={s.overlayHint}>{WIN_COUNT} סכומים נכונים!</Text>
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
  diceRow:   { flexDirection: 'row', gap: 12 },
  dieFace:   { fontSize: 52 },
  choicesWrap:{ flexDirection: 'row', gap: 14, width: '100%', justifyContent: 'center' },
  choiceBtn:  { width: 72, height: 64, backgroundColor: '#111830', borderRadius: 14, borderWidth: 1, borderColor: '#2A2A5A', alignItems: 'center', justifyContent: 'center' },
  choiceText: { color: '#D4AF37', fontSize: 24, fontWeight: '900' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
