import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W      = SW - 48;
const BAR_W  = W - 48;
const WIN_COUNT  = 10;
const MAX_MISS   = 3;
const BASE_SPEED = 0.005;

const GREEN_LO = 0.35;
const GREEN_HI = 0.65;

export default function TimingGame({ onFinish }) {
  const [status, setStatus]     = useState('idle');
  const [score, setScore]       = useState(0);
  const [misses, setMisses]     = useState(0);
  const [sliderPct, setSliderPct] = useState(0);
  const [flash, setFlash]       = useState(null); // 'hit' | 'miss' | null

  const posRef    = useRef(0);
  const dirRef    = useRef(1);
  const scoreRef  = useRef(0);
  const missRef   = useRef(0);
  const statusRef = useRef('idle');
  const loopRef   = useRef(null);

  const die = useCallback(() => {
    clearInterval(loopRef.current);
    statusRef.current = 'dead';
    setStatus('dead');
  }, []);

  const win = useCallback(() => {
    clearInterval(loopRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current), 800);
  }, [onFinish]);

  const startLoop = useCallback(() => {
    loopRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;
      const speed = BASE_SPEED + scoreRef.current * 0.0003;
      posRef.current += dirRef.current * speed;
      if (posRef.current >= 1) { posRef.current = 1; dirRef.current = -1; }
      if (posRef.current <= 0) { posRef.current = 0; dirRef.current =  1; }
      setSliderPct(posRef.current);
    }, 16);
  }, []);

  const tap = useCallback(() => {
    if (statusRef.current !== 'running') return;
    const pos = posRef.current;
    const hit = pos >= GREEN_LO && pos <= GREEN_HI;
    if (hit) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
      setTimeout(() => setFlash(null), 280);
      if (scoreRef.current >= WIN_COUNT) win();
    } else {
      missRef.current += 1;
      setMisses(missRef.current);
      setFlash('miss');
      setTimeout(() => setFlash(null), 280);
      if (missRef.current >= MAX_MISS) die();
    }
  }, [win, die]);

  const startGame = () => {
    clearInterval(loopRef.current);
    posRef.current   = 0;
    dirRef.current   = 1;
    scoreRef.current = 0;
    missRef.current  = 0;
    statusRef.current = 'running';
    setScore(0);
    setMisses(0);
    setFlash(null);
    setSliderPct(0);
    setStatus('running');
    startLoop();
  };

  useEffect(() => () => clearInterval(loopRef.current), []);

  const inGreen  = sliderPct >= GREEN_LO && sliderPct <= GREEN_HI;
  const sliderX  = sliderPct * BAR_W;

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>🎯 {score} / {WIN_COUNT}</Text>
          <View style={s.livesRow}>
            {[...Array(MAX_MISS)].map((_, i) => (
              <Text key={i} style={{ fontSize: 18, opacity: i < (MAX_MISS - misses) ? 1 : 0.15 }}>❤️</Text>
            ))}
          </View>
        </View>
      )}

      <View style={[s.game, flash === 'hit' && s.gameHit, flash === 'miss' && s.gameMiss]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060610' }]} />

        {status === 'running' && (
          <View style={s.inner}>
            {/* Title */}
            <Text style={s.trackTitle}>קנה בזמן הנכון</Text>

            {/* Track */}
            <View style={s.trackWrap}>
              <View style={s.track}>
                {/* Zones */}
                <View style={[s.zone, { width: BAR_W * GREEN_LO, backgroundColor: '#C0392B33' }]} />
                <View style={[s.zone, { width: BAR_W * (GREEN_HI - GREEN_LO), backgroundColor: '#2ECC7140' }]} />
                <View style={[s.zone, { flex: 1, backgroundColor: '#C0392B33' }]} />

                {/* Slider */}
                <View style={[s.slider, { left: sliderX - 5, backgroundColor: inGreen ? '#2ECC71' : '#FFF' }]} />
              </View>

              {/* Zone labels */}
              <View style={s.zoneLabels}>
                <Text style={s.zoneRed}>מוקדם</Text>
                <Text style={s.zoneGreen}>✅ כאן!</Text>
                <Text style={s.zoneRed}>מאוחר</Text>
              </View>
            </View>

            {/* Status hint */}
            <Text style={[s.hint, { color: inGreen ? '#2ECC71' : '#888' }]}>
              {inGreen ? '← עכשיו! →' : '⏳ המתן לאזור הירוק...'}
            </Text>

            {/* Big tap button */}
            <TouchableOpacity
              onPress={tap}
              activeOpacity={0.75}
              style={[s.tapBtn, flash === 'hit' && s.tapHit, flash === 'miss' && s.tapMiss]}
            >
              <Text style={s.tapLabel}>
                {flash === 'hit' ? '✅ מצוין!' : flash === 'miss' ? '❌ פספסת' : '💰 קנה'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🎯</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'דיוק המשקיע' : 'פספסת יותר מדי!'}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `הקש כשהחץ הלבן באזור הירוק\n${WIN_COUNT} הצלחות לניצחון`
                : `הצלחת ${score} פעמים`}
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
            <Text style={s.overlayHint}>תזמון מושלם — {WIN_COUNT} קניות מדויקות!</Text>
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
    width: W, height: 340,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 2, borderColor: '#1A1A3A',
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },
  gameHit:  { borderColor: '#2ECC71' },
  gameMiss: { borderColor: '#E74C3C' },

  inner: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 20,
  },
  trackTitle: { color: '#666', fontSize: 13, textAlign: 'center' },

  trackWrap: { width: BAR_W, gap: 8 },
  track: {
    width: BAR_W, height: 32,
    borderRadius: 16, overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
    borderWidth: 1, borderColor: '#2A2A4A',
  },
  zone: { height: '100%' },
  slider: {
    position: 'absolute',
    top: 4, bottom: 4, width: 10,
    borderRadius: 5,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 8, elevation: 6,
  },
  zoneLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  zoneRed:   { color: '#E74C3C', fontSize: 11, fontWeight: '700' },
  zoneGreen: { color: '#2ECC71', fontSize: 11, fontWeight: '700' },

  hint: { fontSize: 14, fontWeight: '700', textAlign: 'center' },

  tapBtn: {
    backgroundColor: '#C0392B',
    borderRadius: 24,
    paddingHorizontal: 52, paddingVertical: 22,
    borderWidth: 2, borderColor: '#E74C3C',
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7, shadowRadius: 14, elevation: 8,
  },
  tapHit:  { backgroundColor: '#27AE60', borderColor: '#2ECC71', shadowColor: '#2ECC71' },
  tapMiss: { backgroundColor: '#7B241C', borderColor: '#C0392B' },
  tapLabel: { color: '#FFF', fontSize: 22, fontWeight: '900' },

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
    marginTop: 8, backgroundColor: 'rgba(192,57,43,0.20)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(192,57,43,0.50)',
    paddingHorizontal: 28, paddingVertical: 12,
  },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
