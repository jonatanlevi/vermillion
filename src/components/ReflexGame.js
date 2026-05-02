import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const WIN_COUNT = 15;
const MAX_MISS  = 3;
const APPEAR_MS = 1100;

const COINS = ['₪', '💰', '🪙', '💎', '🏆'];

export default function ReflexGame({ onFinish }) {
  const [status, setStatus]       = useState('idle');
  const [score, setScore]         = useState(0);
  const [misses, setMisses]       = useState(0);
  const [activeCell, setActiveCell] = useState(null);
  const [coinIcon, setCoinIcon]   = useState('₪');
  const [flashCell, setFlashCell] = useState(null);

  const scoreRef    = useRef(0);
  const missRef     = useRef(0);
  const statusRef   = useRef('idle');
  const lastCell    = useRef(null);
  const timerRef    = useRef(null);
  const disappearRef = useRef(null);

  const die = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(disappearRef.current);
    statusRef.current = 'dead';
    setStatus('dead');
    setActiveCell(null);
  }, []);

  const win = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(disappearRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setActiveCell(null);
    setTimeout(() => onFinish(scoreRef.current), 800);
  }, [onFinish]);

  const showNext = useCallback(() => {
    if (statusRef.current !== 'running') return;
    let cell;
    do { cell = Math.floor(Math.random() * 9); } while (cell === lastCell.current);
    lastCell.current = cell;
    const icon = COINS[Math.floor(Math.random() * COINS.length)];
    setCoinIcon(icon);
    setActiveCell(cell);

    disappearRef.current = setTimeout(() => {
      if (statusRef.current !== 'running') return;
      setActiveCell(null);
      missRef.current += 1;
      setMisses(missRef.current);
      if (missRef.current >= MAX_MISS) { die(); return; }
      timerRef.current = setTimeout(showNext, 250);
    }, APPEAR_MS);
  }, [die]);

  const tapCell = useCallback((cell) => {
    if (statusRef.current !== 'running' || cell !== lastCell.current) return;
    clearTimeout(disappearRef.current);
    setFlashCell(cell);
    setTimeout(() => setFlashCell(null), 200);
    setActiveCell(null);
    scoreRef.current += 1;
    setScore(scoreRef.current);
    if (scoreRef.current >= WIN_COUNT) { win(); return; }
    const delay = Math.max(200, 350 - scoreRef.current * 5);
    timerRef.current = setTimeout(showNext, delay);
  }, [showNext, win]);

  const startGame = () => {
    clearTimeout(timerRef.current);
    clearTimeout(disappearRef.current);
    scoreRef.current = 0;
    missRef.current  = 0;
    lastCell.current = null;
    statusRef.current = 'running';
    setScore(0);
    setMisses(0);
    setStatus('running');
    setActiveCell(null);
    setFlashCell(null);
    timerRef.current = setTimeout(showNext, 600);
  };

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    clearTimeout(disappearRef.current);
  }, []);

  const CELL_W = Math.floor((W - 32 - 16) / 3);
  const CELL_H = Math.floor((H - 32 - 16) / 3);

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>🪙 {score} / {WIN_COUNT}</Text>
          <View style={s.livesRow}>
            {[...Array(MAX_MISS)].map((_, i) => (
              <Text key={i} style={{ fontSize: 18, opacity: i < (MAX_MISS - misses) ? 1 : 0.15 }}>❤️</Text>
            ))}
          </View>
        </View>
      )}

      <View style={s.game}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080A14' }]} />

        {/* Background shimmer dots */}
        {[...Array(20)].map((_, i) => (
          <View key={i} style={[s.dot, {
            left: (i * 71 + 13) % (W - 6),
            top:  (i * 43 + 7)  % (H - 6),
            opacity: 0.08 + (i % 3) * 0.06,
          }]} />
        ))}

        {/* Grid */}
        <View style={s.grid}>
          {[0, 1, 2].map(row => (
            <View key={row} style={s.gridRow}>
              {[0, 1, 2].map(col => {
                const idx = row * 3 + col;
                const isActive = activeCell === idx;
                const isFlash  = flashCell  === idx;
                return (
                  <TouchableOpacity
                    key={col}
                    onPress={() => isActive && tapCell(idx)}
                    activeOpacity={isActive ? 0.5 : 1}
                    style={[
                      s.cell,
                      { width: CELL_W, height: CELL_H },
                      isActive && s.cellActive,
                      isFlash  && s.cellFlash,
                    ]}
                  >
                    {isActive && (
                      <>
                        <View style={[StyleSheet.absoluteFill, s.cellGlow]} />
                        <Text style={s.coinIcon}>{coinIcon}</Text>
                      </>
                    )}
                    {isFlash && (
                      <View style={[StyleSheet.absoluteFill, s.cellFlashOverlay]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🪙</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'רפלקסים פיננסיים' : 'פספסת יותר מדי!'}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `המטבע מופיע לשנייה — הקש מהר!\n${WIN_COUNT} ניצחונות לסיום`
                : `לכדת ${score} מטבעות`}
            </Text>
            <View style={s.overlayBtn}>
              <Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>כל הכבוד!</Text>
            <Text style={s.overlayHint}>רפלקסים של מנצח! {WIN_COUNT} מטבעות!</Text>
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
  livesRow:  { flexDirection: 'row', gap: 4 },

  game: {
    width: W, height: H,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 2, borderColor: '#1A1A3A',
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },
  dot: {
    position: 'absolute', width: 4, height: 4,
    borderRadius: 2, backgroundColor: '#D4AF37',
  },

  grid: { padding: 16, gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8 },

  cell: {
    borderRadius: 14,
    backgroundColor: '#0F1020',
    borderWidth: 1, borderColor: '#2A2A4A',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  cellActive: {
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 14, elevation: 10,
  },
  cellFlash: { borderColor: '#2ECC71' },
  cellGlow: {
    borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  cellFlashOverlay: {
    borderRadius: 14,
    backgroundColor: 'rgba(46,204,113,0.30)',
  },
  coinIcon: { fontSize: 30, zIndex: 2 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,15,0.88)',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn: {
    marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)',
    paddingHorizontal: 28, paddingVertical: 12,
  },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
