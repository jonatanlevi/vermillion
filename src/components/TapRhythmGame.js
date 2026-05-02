import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions, Animated } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W          = SW - 48;
const H          = 340;
const CENTER     = { x: W / 2, y: H / 2 };
const TARGET_R   = 28;
const OUTER_R    = W * 0.42;
const WIN_COUNT  = 10;
const MAX_MISS   = 3;

const ZONE_COLORS = {
  perfect: '#D4AF37',
  good:    '#2ECC71',
  miss:    '#E74C3C',
};

function getZone(ratio) {
  if (ratio > 0.88) return 'perfect';
  if (ratio > 0.70) return 'good';
  return 'miss';
}

export default function TapRhythmGame({ onFinish }) {
  const [status, setStatus]   = useState('idle');
  const [score, setScore]     = useState(0);
  const [misses, setMisses]   = useState(0);
  const [ringR, setRingR]     = useState(OUTER_R);
  const [flash, setFlash]     = useState(null); // 'perfect' | 'good' | 'miss' | null
  const [combo, setCombo]     = useState(0);

  const ringRef    = useRef(OUTER_R);
  const shrinkRef  = useRef(null);
  const scoreRef   = useRef(0);
  const missRef    = useRef(0);
  const comboRef   = useRef(0);
  const statusRef  = useRef('idle');

  const die = useCallback(() => {
    clearInterval(shrinkRef.current);
    statusRef.current = 'dead';
    setStatus('dead');
  }, []);

  const win = useCallback(() => {
    clearInterval(shrinkRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current), 800);
  }, [onFinish]);

  const nextRound = useCallback(() => {
    if (statusRef.current !== 'running') return;
    ringRef.current = OUTER_R;
    setRingR(OUTER_R);
    const speed = 0.9 + scoreRef.current * 0.06;
    shrinkRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;
      ringRef.current -= speed;
      if (ringRef.current <= TARGET_R - 4) {
        clearInterval(shrinkRef.current);
        // ring passed without tap = miss
        missRef.current += 1;
        comboRef.current = 0;
        setMisses(missRef.current);
        setCombo(0);
        setFlash('miss');
        setTimeout(() => {
          setFlash(null);
          if (missRef.current >= MAX_MISS) { die(); return; }
          nextRound();
        }, 400);
        return;
      }
      setRingR(ringRef.current);
    }, 16);
  }, [die]);

  const tap = useCallback(() => {
    if (statusRef.current !== 'running') return;
    clearInterval(shrinkRef.current);

    const ratio = 1 - (ringRef.current - TARGET_R) / (OUTER_R - TARGET_R);
    const zone  = getZone(ratio);

    if (zone === 'miss') {
      missRef.current += 1;
      comboRef.current = 0;
      setMisses(missRef.current);
      setCombo(0);
      setFlash('miss');
      setTimeout(() => {
        setFlash(null);
        if (missRef.current >= MAX_MISS) { die(); return; }
        nextRound();
      }, 400);
    } else {
      const pts = zone === 'perfect' ? 2 : 1;
      scoreRef.current += pts;
      comboRef.current += 1;
      setScore(scoreRef.current);
      setCombo(comboRef.current);
      setFlash(zone);
      setTimeout(() => {
        setFlash(null);
        if (scoreRef.current >= WIN_COUNT) { win(); return; }
        nextRound();
      }, 300);
    }
  }, [die, win, nextRound]);

  const startGame = () => {
    clearInterval(shrinkRef.current);
    scoreRef.current = 0;
    missRef.current  = 0;
    comboRef.current = 0;
    statusRef.current = 'running';
    setScore(0);
    setMisses(0);
    setCombo(0);
    setFlash(null);
    setStatus('running');
    ringRef.current = OUTER_R;
    setRingR(OUTER_R);
    setTimeout(nextRound, 600);
  };

  const handlePress = () => {
    if (status === 'idle' || status === 'dead') { startGame(); return; }
    tap();
  };

  useEffect(() => () => clearInterval(shrinkRef.current), []);

  const ringColor = flash
    ? ZONE_COLORS[flash]
    : ringR < TARGET_R + 18
      ? ZONE_COLORS.perfect
      : ringR < TARGET_R + 40
        ? ZONE_COLORS.good
        : '#3A3A5A';

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={s.wrapper}>
        {status === 'running' && (
          <View style={s.scoreRow}>
            <Text style={s.scoreText}>🎵 {score} / {WIN_COUNT}</Text>
            <View style={s.right}>
              {combo > 1 && <Text style={s.combo}>×{combo}</Text>}
              <View style={s.livesRow}>
                {[...Array(MAX_MISS)].map((_, i) => (
                  <Text key={i} style={{ fontSize: 16, opacity: i < (MAX_MISS - misses) ? 1 : 0.15 }}>❤️</Text>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={s.game}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050510' }]} />

          {/* Background pulse rings */}
          {[0.25, 0.5, 0.75].map((f, i) => (
            <View key={i} style={[s.bgRing, {
              left:   CENTER.x - OUTER_R * f,
              top:    CENTER.y - OUTER_R * f,
              width:  OUTER_R * f * 2,
              height: OUTER_R * f * 2,
              borderRadius: OUTER_R * f,
              opacity: 0.06,
            }]} />
          ))}

          {status === 'running' && (
            <>
              {/* Shrinking ring */}
              <View style={[s.ring, {
                left:        CENTER.x - ringR,
                top:         CENTER.y - ringR,
                width:       ringR * 2,
                height:      ringR * 2,
                borderRadius: ringR,
                borderColor: ringColor,
                shadowColor: ringColor,
              }]} />

              {/* Target circle */}
              <View style={[s.target, {
                left:        CENTER.x - TARGET_R,
                top:         CENTER.y - TARGET_R,
                backgroundColor: flash ? ZONE_COLORS[flash] + '33' : '#1A1A3A',
                borderColor: flash ? ZONE_COLORS[flash] : '#D4AF37',
                shadowColor: flash ? ZONE_COLORS[flash] : '#D4AF37',
              }]}>
                <Text style={s.targetLabel}>
                  {flash === 'perfect' ? '✨' : flash === 'good' ? '✅' : flash === 'miss' ? '❌' : '₪'}
                </Text>
              </View>

              {/* Flash label */}
              {flash && (
                <Text style={[s.flashLabel, { color: ZONE_COLORS[flash] }]}>
                  {flash === 'perfect' ? 'מושלם!' : flash === 'good' ? 'טוב!' : 'פספסת'}
                </Text>
              )}
            </>
          )}

          {(status === 'idle' || status === 'dead') && (
            <View style={s.overlay}>
              <Text style={s.overlayEmoji}>🎵</Text>
              <Text style={s.overlayTitle}>{status === 'idle' ? 'קצב המשקיע' : 'פספסת יותר מדי!'}</Text>
              <Text style={s.overlayHint}>
                {status === 'idle'
                  ? `הטבעת מתכווצת — הקש כשהיא\nמגיעה לעיגול הזהוב\nמושלם = בדיוק עליו`
                  : `הצלחת ${score} פעמים`}
              </Text>
              <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
            </View>
          )}

          {status === 'done' && (
            <View style={s.overlay}>
              <Text style={s.overlayEmoji}>🏆</Text>
              <Text style={s.overlayTitle}>קצב מושלם!</Text>
              <Text style={s.overlayHint}>{WIN_COUNT} תזמונים מדויקים!</Text>
              <Text style={s.overlayNote}>ממשיך...</Text>
            </View>
          )}
        </View>
        {status === 'running' && <Text style={s.hint}>לחץ לתזמן</Text>}
      </View>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  wrapper: { width: W, alignSelf: 'center' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  combo: { color: '#D4AF37', fontSize: 16, fontWeight: '900' },
  livesRow: { flexDirection: 'row', gap: 4 },

  game: {
    width: W, height: H,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 2, borderColor: '#1A1A3A',
    position: 'relative',
  },
  bgRing: {
    position: 'absolute',
    borderWidth: 1, borderColor: '#D4AF37',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 10, elevation: 6,
  },
  target: {
    position: 'absolute',
    width: TARGET_R * 2, height: TARGET_R * 2,
    borderRadius: TARGET_R,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 4,
  },
  targetLabel: { fontSize: 20 },
  flashLabel: {
    position: 'absolute',
    top: CENTER.y - 70,
    left: 0, right: 0,
    textAlign: 'center',
    fontSize: 20, fontWeight: '900',
  },

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
    marginTop: 8, backgroundColor: 'rgba(212,175,55,0.18)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)',
    paddingHorizontal: 28, paddingVertical: 12,
  },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  hint: { textAlign: 'center', color: '#555', fontSize: 12, marginTop: 8 },
});
