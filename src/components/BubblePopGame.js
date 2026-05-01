import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const WIN_COUNT = 20;
const MAX_MISS = 5;

const EXPENSES = [
  { label: 'נטפליקס', color: '#E50914' },
  { label: 'קפה',     color: '#A0522D' },
  { label: 'שופינג',  color: '#E67E22' },
  { label: 'מסעדה',   color: '#E74C3C' },
  { label: 'ביטוח',   color: '#3498DB' },
  { label: 'דלק',     color: '#F39C12' },
  { label: 'מנוי',    color: '#9B59B6' },
  { label: 'חשמל',    color: '#1ABC9C' },
];

let _id = 0;
function makeBubble() {
  const exp = EXPENSES[Math.floor(Math.random() * EXPENSES.length)];
  const r = 24 + Math.random() * 14;
  return {
    id: ++_id,
    x: r + Math.random() * (W - r * 2),
    y: H + r,
    r,
    speed: 0.7 + Math.random() * 1.0,
    label: exp.label,
    color: exp.color,
  };
}

export default function BubblePopGame({ onFinish }) {
  const [status, setStatus]   = useState('idle');
  const [score, setScore]     = useState(0);
  const [misses, setMisses]   = useState(0);
  const [snap, setSnap]       = useState([]);

  const bubblesRef  = useRef([]);
  const poppedIds   = useRef(new Set());
  const scoreRef    = useRef(0);
  const missRef     = useRef(0);
  const statusRef   = useRef('idle');
  const loopRef     = useRef(null);
  const spawnRef    = useRef(null);

  const die = useCallback(() => {
    clearInterval(loopRef.current);
    clearInterval(spawnRef.current);
    statusRef.current = 'dead';
    setStatus('dead');
  }, []);

  const win = useCallback(() => {
    clearInterval(loopRef.current);
    clearInterval(spawnRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current), 800);
  }, [onFinish]);

  const startLoop = useCallback(() => {
    spawnRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;
      if (bubblesRef.current.length < 6) {
        bubblesRef.current = [...bubblesRef.current, makeBubble()];
      }
    }, 700);

    loopRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;

      bubblesRef.current = bubblesRef.current
        .filter(b => !poppedIds.current.has(b.id))
        .map(b => ({ ...b, y: b.y - b.speed }));

      const escaped = bubblesRef.current.filter(b => b.y + b.r < 0);
      if (escaped.length > 0) {
        bubblesRef.current = bubblesRef.current.filter(b => b.y + b.r >= 0);
        missRef.current += escaped.length;
        setMisses(missRef.current);
        if (missRef.current >= MAX_MISS) { die(); return; }
      }

      setSnap([...bubblesRef.current]);
    }, 16);
  }, [die]);

  const popBubble = useCallback((id) => {
    if (statusRef.current !== 'running') return;
    if (poppedIds.current.has(id)) return;
    poppedIds.current.add(id);
    scoreRef.current += 1;
    setScore(scoreRef.current);
    if (scoreRef.current >= WIN_COUNT) win();
  }, [win]);

  const startGame = () => {
    clearInterval(loopRef.current);
    clearInterval(spawnRef.current);
    poppedIds.current.clear();
    bubblesRef.current = [makeBubble(), makeBubble(), makeBubble()];
    scoreRef.current = 0;
    missRef.current = 0;
    statusRef.current = 'running';
    setScore(0);
    setMisses(0);
    setStatus('running');
    setSnap([...bubblesRef.current]);
    startLoop();
  };

  useEffect(() => () => {
    clearInterval(loopRef.current);
    clearInterval(spawnRef.current);
  }, []);

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>💥 {score} / {WIN_COUNT}</Text>
          <Text style={s.missText}>ברחו: {misses} / {MAX_MISS}</Text>
        </View>
      )}

      <View style={s.game}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080818' }]} />
        {[...Array(16)].map((_, i) => (
          <View key={i} style={[s.star, { left: (i * 53 + 17) % (W - 4), top: (i * 37 + 11) % (H - 4) }]} />
        ))}

        {snap.map(b => (
          <TouchableOpacity
            key={b.id}
            activeOpacity={0.5}
            onPress={() => popBubble(b.id)}
            style={[s.bubble, {
              left: b.x - b.r,
              top: b.y - b.r,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: b.r,
              borderColor: b.color,
              shadowColor: b.color,
            }]}
          >
            <View style={[StyleSheet.absoluteFill, { borderRadius: b.r, backgroundColor: b.color + '22' }]} />
            <Text style={[s.bubbleLabel, { fontSize: b.r > 32 ? 10 : 9 }]}>{b.label}</Text>
          </TouchableOpacity>
        ))}

        {(status === 'idle' || status === 'dead') && (
          <TouchableWithoutFeedback onPress={startGame}>
            <View style={s.overlay}>
              <Text style={s.overlayEmoji}>💸</Text>
              <Text style={s.overlayTitle}>{status === 'idle' ? 'פוצץ את הבזבוזים' : 'ברחו יותר מדי!'}</Text>
              <Text style={s.overlayHint}>
                {status === 'idle'
                  ? `הוצאות עולות — הקש לפוצץ\nאל תתן ל-${MAX_MISS} לברוח`
                  : `פוצצת ${score} הוצאות`}
              </Text>
              <View style={s.overlayBtn}>
                <Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}

        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>כל הכבוד!</Text>
            <Text style={s.overlayHint}>פוצצת {WIN_COUNT} הוצאות!</Text>
            <Text style={s.overlayNote}>ממשיך...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { width: W, alignSelf: 'center' },
  scoreRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  scoreText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  missText:  { color: '#E74C3C', fontSize: 14, fontWeight: '700' },

  game: {
    width: W, height: H,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 2, borderColor: '#1A1A3A',
    position: 'relative',
  },
  star: {
    position: 'absolute', width: 2, height: 2,
    borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.35)',
  },
  bubble: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 8, elevation: 4,
  },
  bubbleLabel: { color: '#FFF', fontWeight: '800', textAlign: 'center' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,15,0.85)',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn: {
    marginTop: 8, backgroundColor: 'rgba(192,57,43,0.20)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(192,57,43,0.50)',
    paddingHorizontal: 28, paddingVertical: 12,
  },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
