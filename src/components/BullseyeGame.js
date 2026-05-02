import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W   = SW - 48;
const H   = 330;
const CX  = W / 2;
const CY  = H / 2;
const R1  = 20;   // inner (perfect)
const R2  = 42;   // middle
const R3  = 64;   // outer
const WIN_SCORE = 20;
const MAX_MISS  = 3;

export default function BullseyeGame({ onFinish }) {
  const [status, setStatus]   = useState('idle');
  const [score, setScore]     = useState(0);
  const [misses, setMisses]   = useState(0);
  const [dotPos, setDotPos]   = useState({ x: CX + R2, y: CY });
  const [flash, setFlash]     = useState(null);

  const angle    = useRef(0);
  const orbit    = useRef(R2);
  const scoreRef = useRef(0);
  const missRef  = useRef(0);
  const statusRef = useRef('idle');
  const loopRef  = useRef(null);

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
      const base   = 0.045 + scoreRef.current * 0.003;
      angle.current += base;
      orbit.current = R2 + Math.sin(angle.current * 0.7) * (R2 + 10);
      const x = CX + Math.cos(angle.current) * orbit.current;
      const y = CY + Math.sin(angle.current * 1.3) * orbit.current * 0.6;
      setDotPos({ x, y });
    }, 16);
  }, []);

  const shoot = useCallback(() => {
    if (statusRef.current !== 'running') return;
    const dx   = dotPos.x - CX;
    const dy   = dotPos.y - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let pts = 0;
    let zone = 'miss';
    if (dist <= R1)      { pts = 3; zone = 'perfect'; }
    else if (dist <= R2) { pts = 2; zone = 'good'; }
    else if (dist <= R3) { pts = 1; zone = 'ok'; }
    else                 { zone = 'miss'; }

    if (zone === 'miss') {
      missRef.current += 1;
      setMisses(missRef.current);
      setFlash('miss');
      setTimeout(() => setFlash(null), 300);
      if (missRef.current >= MAX_MISS) die();
    } else {
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setFlash(zone);
      setTimeout(() => setFlash(null), 300);
      if (scoreRef.current >= WIN_SCORE) win();
    }
  }, [dotPos, die, win]);

  const handlePress = () => {
    if (status === 'idle' || status === 'dead') { startGame(); return; }
    shoot();
  };

  const startGame = () => {
    clearInterval(loopRef.current);
    angle.current  = 0;
    orbit.current  = R2;
    scoreRef.current = 0;
    missRef.current  = 0;
    statusRef.current = 'running';
    setScore(0);
    setMisses(0);
    setFlash(null);
    setStatus('running');
    startLoop();
  };

  useEffect(() => () => clearInterval(loopRef.current), []);

  const ringColor = flash === 'perfect' ? '#D4AF37' : flash === 'good' ? '#2ECC71' : flash === 'miss' ? '#E74C3C' : null;

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={s.wrapper}>
        {status === 'running' && (
          <View style={s.scoreRow}>
            <Text style={s.scoreText}>🎯 {score} / {WIN_SCORE}</Text>
            <View style={s.livesRow}>
              {[...Array(MAX_MISS)].map((_, i) => (
                <Text key={i} style={{ fontSize: 16, opacity: i < (MAX_MISS - misses) ? 1 : 0.15 }}>❤️</Text>
              ))}
            </View>
          </View>
        )}

        <View style={s.game}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060610' }]} />

          {status === 'running' && (
            <>
              {/* Rings */}
              {[R3, R2, R1].map((r, i) => (
                <View key={r} style={[s.ring, {
                  left: CX - r, top: CY - r, width: r * 2, height: r * 2, borderRadius: r,
                  borderColor: i === 0 ? '#C0392B44' : i === 1 ? '#2ECC7166' : '#D4AF3799',
                  backgroundColor: i === 0 ? '#C0392B11' : i === 1 ? '#2ECC7111' : '#D4AF3722',
                  ...(ringColor && i === 0 && { borderColor: ringColor + '88' }),
                }]} />
              ))}

              {/* Score labels */}
              <Text style={[s.ringLabel, { left: CX + R3 + 4, top: CY - 8, color: '#C0392B' }]}>1</Text>
              <Text style={[s.ringLabel, { left: CX + R2 + 4, top: CY - 8, color: '#2ECC71' }]}>2</Text>
              <Text style={[s.ringLabel, { left: CX + R1 + 2, top: CY - 8, color: '#D4AF37' }]}>3</Text>

              {/* Moving dot */}
              <View style={[s.dot, { left: dotPos.x - 8, top: dotPos.y - 8 }]} />

              {/* Flash */}
              {flash && (
                <Text style={[s.flashText, { color: ringColor }]}>
                  {flash === 'perfect' ? '✨ מושלם! +3' : flash === 'good' ? '✅ טוב! +2' : flash === 'ok' ? '+1' : '❌ החטאת'}
                </Text>
              )}
            </>
          )}

          {(status === 'idle' || status === 'dead') && (
            <View style={s.overlay}>
              <Text style={s.overlayEmoji}>🎯</Text>
              <Text style={s.overlayTitle}>{status === 'idle' ? 'מרכז העניינים' : 'פספסת יותר מדי!'}</Text>
              <Text style={s.overlayHint}>
                {status === 'idle'
                  ? `הנקודה זזה — הקש כשהיא במרכז\nמרכז=3 | אמצע=2 | חוץ=1\n${WIN_SCORE} נקודות לניצחון`
                  : `צברת ${score} נקודות`}
              </Text>
              <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
            </View>
          )}
          {status === 'done' && (
            <View style={s.overlay}>
              <Text style={s.overlayEmoji}>🏆</Text>
              <Text style={s.overlayTitle}>כל הכבוד!</Text>
              <Text style={s.overlayHint}>צברת {WIN_SCORE} נקודות!</Text>
              <Text style={s.overlayNote}>ממשיך...</Text>
            </View>
          )}
        </View>
        {status === 'running' && <Text style={s.hint}>לחץ לירות</Text>}
      </View>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  wrapper: { width: W, alignSelf: 'center' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  livesRow: { flexDirection: 'row', gap: 4 },
  game: { width: W, height: H, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: '#1A1A2A', position: 'relative' },
  ring: { position: 'absolute', borderWidth: 2 },
  ringLabel: { position: 'absolute', fontSize: 11, fontWeight: '800' },
  dot: {
    position: 'absolute', width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FFF',
    shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 8,
  },
  flashText: { position: 'absolute', top: CY - 90, left: 0, right: 0, textAlign: 'center', fontSize: 18, fontWeight: '900' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote: { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn: { marginTop: 8, backgroundColor: 'rgba(192,57,43,0.20)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(192,57,43,0.50)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  hint: { textAlign: 'center', color: '#555', fontSize: 12, marginTop: 8 },
});
