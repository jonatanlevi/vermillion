import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 330;
const HOLE_R   = 30;
const WIN_COUNT = 15;
const MAX_MISS  = 3;
const SHOW_MS   = 1100;
const SPAWN_MS  = 650;

const HOLES = [
  { x: W*0.18, y: H*0.22 }, { x: W*0.50, y: H*0.18 }, { x: W*0.82, y: H*0.22 },
  { x: W*0.12, y: H*0.52 }, { x: W*0.50, y: H*0.50 }, { x: W*0.88, y: H*0.52 },
  { x: W*0.28, y: H*0.80 }, { x: W*0.72, y: H*0.80 },
];

const MOLES = [
  { type: 'coin', label: '🪙', color: '#D4AF37', good: true  },
  { type: 'coin', label: '💰', color: '#D4AF37', good: true  },
  { type: 'bomb', label: '💣', color: '#E74C3C', good: false },
];

export default function WhackMoleGame({ onFinish }) {
  const [status, setStatus]   = useState('idle');
  const [score, setScore]     = useState(0);
  const [misses, setMisses]   = useState(0);
  const [moles, setMoles]     = useState(Array(8).fill(null));

  const molesRef   = useRef(Array(8).fill(null));
  const scoreRef   = useRef(0);
  const missRef    = useRef(0);
  const statusRef  = useRef('idle');
  const spawnRef   = useRef(null);
  const timers     = useRef({});

  const die = useCallback(() => {
    clearInterval(spawnRef.current);
    Object.values(timers.current).forEach(clearTimeout);
    statusRef.current = 'dead';
    setStatus('dead');
  }, []);

  const win = useCallback(() => {
    clearInterval(spawnRef.current);
    Object.values(timers.current).forEach(clearTimeout);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current), 800);
  }, [onFinish]);

  const hideMole = useCallback((idx) => {
    molesRef.current = [...molesRef.current];
    molesRef.current[idx] = null;
    setMoles([...molesRef.current]);
  }, []);

  const spawnMole = useCallback(() => {
    if (statusRef.current !== 'running') return;
    const empty = molesRef.current
      .map((m, i) => m === null ? i : -1)
      .filter(i => i >= 0);
    if (empty.length === 0) return;

    const idx  = empty[Math.floor(Math.random() * empty.length)];
    const mole = MOLES[Math.floor(Math.random() * MOLES.length)];
    molesRef.current = [...molesRef.current];
    molesRef.current[idx] = { ...mole, idx };
    setMoles([...molesRef.current]);

    if (mole.good) {
      timers.current[idx] = setTimeout(() => {
        if (statusRef.current !== 'running') return;
        if (molesRef.current[idx] !== null) {
          missRef.current += 1;
          setMisses(missRef.current);
          if (missRef.current >= MAX_MISS) { die(); return; }
          hideMole(idx);
        }
      }, SHOW_MS);
    } else {
      timers.current[idx] = setTimeout(() => hideMole(idx), SHOW_MS + 200);
    }
  }, [die, hideMole]);

  const tapMole = useCallback((idx) => {
    if (statusRef.current !== 'running') return;
    const mole = molesRef.current[idx];
    if (!mole) return;
    clearTimeout(timers.current[idx]);
    hideMole(idx);

    if (mole.good) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      if (scoreRef.current >= WIN_COUNT) win();
    } else {
      missRef.current += 1;
      setMisses(missRef.current);
      if (missRef.current >= MAX_MISS) die();
    }
  }, [die, win, hideMole]);

  const startGame = () => {
    clearInterval(spawnRef.current);
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    molesRef.current = Array(8).fill(null);
    scoreRef.current = 0;
    missRef.current  = 0;
    statusRef.current = 'running';
    setScore(0);
    setMisses(0);
    setMoles(Array(8).fill(null));
    setStatus('running');
    spawnRef.current = setInterval(spawnMole, SPAWN_MS);
  };

  useEffect(() => () => {
    clearInterval(spawnRef.current);
    Object.values(timers.current).forEach(clearTimeout);
  }, []);

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>🔨 {score} / {WIN_COUNT}</Text>
          <View style={s.livesRow}>
            {[...Array(MAX_MISS)].map((_, i) => (
              <Text key={i} style={{ fontSize: 16, opacity: i < (MAX_MISS - misses) ? 1 : 0.15 }}>❤️</Text>
            ))}
          </View>
        </View>
      )}

      <View style={s.game}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0C10' }]} />

        {HOLES.map((h, i) => (
          <View key={i} style={[s.hole, { left: h.x - HOLE_R, top: h.y - HOLE_R }]} />
        ))}

        {moles.map((m, i) => m && (
          <TouchableOpacity
            key={i}
            onPress={() => tapMole(i)}
            activeOpacity={0.5}
            style={[s.mole, {
              left: HOLES[i].x - HOLE_R,
              top:  HOLES[i].y - HOLE_R,
              backgroundColor: m.color + '33',
              borderColor: m.color,
              shadowColor: m.color,
            }]}
          >
            <Text style={s.moleLabel}>{m.label}</Text>
          </TouchableOpacity>
        ))}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🔨</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'הכה את החובות' : 'פספסת יותר מדי!'}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `הקש ₪ ו-💰 מהר!\nהימנע מ-💣\n${WIN_COUNT} הצלחות לניצחון`
                : `הצלחת ${score} פעמים`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>כל הכבוד!</Text>
            <Text style={s.overlayHint}>הכית {WIN_COUNT} חובות!</Text>
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
  hole: {
    position: 'absolute', width: HOLE_R * 2, height: HOLE_R * 2,
    borderRadius: HOLE_R, backgroundColor: '#111', borderWidth: 2, borderColor: '#222',
  },
  mole: {
    position: 'absolute', width: HOLE_R * 2, height: HOLE_R * 2,
    borderRadius: HOLE_R, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 6,
  },
  moleLabel: { fontSize: 22 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote: { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn: { marginTop: 8, backgroundColor: 'rgba(192,57,43,0.20)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(192,57,43,0.50)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
