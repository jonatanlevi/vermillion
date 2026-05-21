import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W  = SW - 48;
const H  = 340;
const ROUNDS   = 8;
const CHAIN    = 6;
const TIMEOUT_MS = 4000;

const AREA_W = W - 48;
const AREA_H = H - 48;

function genDots() {
  const dots = [];
  for (let i = 1; i <= CHAIN; i++) {
    dots.push({
      num: i,
      x: Math.floor(Math.random() * (AREA_W - 48)) + 24,
      y: Math.floor(Math.random() * (AREA_H - 48)) + 24,
    });
  }
  return dots;
}

export default function ChainTapGame({ onFinish }) {
  const [status,  setStatus]  = useState('idle');
  const [round,   setRound]   = useState(0);
  const [dots,    setDots]    = useState([]);
  const [nextNum, setNextNum] = useState(1);
  const [flash,   setFlash]   = useState(null);
  const [score,   setScore]   = useState(0);
  const [tapped,  setTapped]  = useState(new Set());

  const roundRef  = useRef(0);
  const nextRef   = useRef(1);
  const scoreRef  = useRef(0);
  const statusRef = useRef('idle');
  const timerRef  = useRef(null);
  const tappedRef = useRef(new Set());
  const startRoundRef = useRef(null);

  const win = useCallback(() => {
    clearTimeout(timerRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current * 10), 800);
  }, [onFinish]);

  function startRound(r) {
    clearTimeout(timerRef.current);
    const d = genDots();
    roundRef.current = r;
    nextRef.current  = 1;
    tappedRef.current = new Set();
    setDots(d); setRound(r); setNextNum(1); setFlash(null); setTapped(new Set());

    timerRef.current = setTimeout(() => {
      if (statusRef.current !== 'running') return;
      setFlash('miss');
      timerRef.current = setTimeout(() => {
        if (statusRef.current !== 'running') return;
        const nr = roundRef.current + 1;
        if (nr >= ROUNDS) { win(); return; }
        startRoundRef.current(nr);
      }, 600);
    }, TIMEOUT_MS);
  }
  startRoundRef.current = startRound;

  const tapDot = useCallback((num) => {
    if (statusRef.current !== 'running') return;
    if (tappedRef.current.has(num)) return;
    if (num !== nextRef.current) {
      clearTimeout(timerRef.current);
      setFlash('miss');
      timerRef.current = setTimeout(() => {
        if (statusRef.current !== 'running') return;
        const nr = roundRef.current + 1;
        if (nr >= ROUNDS) { win(); return; }
        startRoundRef.current(nr);
      }, 600);
      return;
    }
    tappedRef.current = new Set([...tappedRef.current, num]);
    nextRef.current += 1;
    setTapped(new Set(tappedRef.current));
    setNextNum(nextRef.current);

    if (tappedRef.current.size >= CHAIN) {
      clearTimeout(timerRef.current);
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
      timerRef.current = setTimeout(() => {
        if (statusRef.current !== 'running') return;
        const nr = roundRef.current + 1;
        if (nr >= ROUNDS) { win(); return; }
        startRoundRef.current(nr);
      }, 600);
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
          <Text style={s.scoreText}>🔗 {round + 1} / {ROUNDS}</Text>
          <Text style={s.pts}>⭐ {score} שלמות</Text>
        </View>
      )}

      <View style={[s.game, { borderColor }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060A10' }]} />

        {status === 'running' && dots.length > 0 && !flash && (
          <View style={s.arena}>
            {dots.map(dot => {
              const done = tappedRef.current.has(dot.num);
              const isNext = dot.num === nextRef.current;
              return (
                <TouchableOpacity
                  key={dot.num}
                  onPress={() => tapDot(dot.num)}
                  style={[
                    s.dot,
                    { left: dot.x - 24, top: dot.y - 24 },
                    done   && s.dotDone,
                    isNext && s.dotNext,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.dotNum, done && s.dotNumDone]}>{dot.num}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {status === 'running' && flash && (
          <View style={s.flashOverlay}>
            <Text style={[s.flashText, { color: flash === 'hit' ? '#2ECC71' : '#E74C3C' }]}>
              {flash === 'hit' ? '🔗 שרשרת!' : '❌ טעות'}
            </Text>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🔗</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'שרשרת מספרים' : 'נסה שוב!'}</Text>
            <Text style={s.overlayHint}>{`הקש עיגולים 1→2→3→...→6 בסדר\n4 שניות לסיבוב\n${ROUNDS} סיבובים`}</Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'שחק שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>שרשרת זהב!</Text>
            <Text style={s.overlayHint}>{score} / {ROUNDS} שרשראות!</Text>
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
  arena:     { position: 'absolute', top: 12, left: 24, right: 24, bottom: 12 },
  dot:       { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: '#111830', borderWidth: 2, borderColor: '#2A2A5A', alignItems: 'center', justifyContent: 'center' },
  dotNext:   { borderColor: '#D4AF37', backgroundColor: '#1A1A08' },
  dotDone:   { borderColor: '#2ECC71', backgroundColor: '#0A2A0A' },
  dotNum:    { color: '#FFF', fontSize: 18, fontWeight: '900' },
  dotNumDone:{ color: '#2ECC71' },
  flashOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flashText: { fontSize: 28, fontWeight: '900' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
