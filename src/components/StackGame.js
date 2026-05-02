import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W        = SW - 48;
const H        = 360;
const BLOCK_H  = 34;
const MAX_BLOCKS = 8;
const MIN_W    = 14;
const BASE_SPD = 2.2;

const COLORS = ['#C0392B','#E67E22','#D4AF37','#2ECC71','#1ABC9C','#3498DB','#9B59B6','#FFD700'];

export default function StackGame({ onFinish }) {
  const [status, setStatus]   = useState('idle');
  const [score, setScore]     = useState(0);
  const [snap, setSnap]       = useState({ stack: [], moving: { x: W / 2, w: W * 0.55 } });

  const stackRef  = useRef([{ x: W / 2, w: W * 0.55 }]);
  const movX      = useRef(W / 2);
  const movW      = useRef(W * 0.55);
  const movDir    = useRef(1);
  const scoreRef  = useRef(0);
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
      const speed = Math.min(BASE_SPD + scoreRef.current * 0.35, 7);
      movX.current += movDir.current * speed;
      const hw = movW.current / 2;
      if (movX.current + hw > W - 4) { movX.current = W - 4 - hw; movDir.current = -1; }
      if (movX.current - hw < 4)     { movX.current = 4 + hw;     movDir.current =  1; }
      setSnap(s => ({ ...s, moving: { x: movX.current, w: movW.current } }));
    }, 16);
  }, []);

  const drop = useCallback(() => {
    if (statusRef.current !== 'running') return;
    const top  = stackRef.current[stackRef.current.length - 1];
    const mxL  = movX.current - movW.current / 2;
    const mxR  = movX.current + movW.current / 2;
    const tL   = top.x - top.w / 2;
    const tR   = top.x + top.w / 2;
    const oL   = Math.max(mxL, tL);
    const oR   = Math.min(mxR, tR);
    const ow   = oR - oL;

    if (ow < MIN_W) { die(); return; }

    const newX = (oL + oR) / 2;
    stackRef.current = [...stackRef.current, { x: newX, w: ow }];
    movX.current = newX;
    movW.current = ow;
    scoreRef.current += 1;
    setScore(scoreRef.current);
    setSnap({ stack: [...stackRef.current], moving: { x: movX.current, w: movW.current } });

    if (scoreRef.current >= MAX_BLOCKS) { win(); return; }
  }, [die, win]);

  const startGame = () => {
    clearInterval(loopRef.current);
    const initW = W * 0.55;
    stackRef.current = [{ x: W / 2, w: initW }];
    movX.current = W / 2;
    movW.current = initW;
    movDir.current = 1;
    scoreRef.current = 0;
    statusRef.current = 'running';
    setScore(0);
    setStatus('running');
    setSnap({ stack: [...stackRef.current], moving: { x: movX.current, w: movW.current } });
    startLoop();
  };

  const handlePress = () => {
    if (status === 'idle' || status === 'dead') { startGame(); return; }
    drop();
  };

  useEffect(() => () => clearInterval(loopRef.current), []);

  const stackLen = snap.stack.length;

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={s.wrapper}>
        {status === 'running' && (
          <View style={s.scoreRow}>
            <Text style={s.scoreText}>🏗️ {score} / {MAX_BLOCKS}</Text>
            <View style={s.dotsRow}>
              {[...Array(MAX_BLOCKS)].map((_, i) => (
                <View key={i} style={[s.dot, i < score && s.dotDone]} />
              ))}
            </View>
          </View>
        )}

        <View style={s.game}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080A0F' }]} />

          {/* Background grid */}
          {[...Array(8)].map((_, i) => (
            <View key={i} style={[s.gridLine, { top: i * 45 }]} />
          ))}

          {/* Stacked blocks */}
          {snap.stack.map((b, i) => (
            <View key={i} style={[s.block, {
              left:   b.x - b.w / 2,
              top:    H - BLOCK_H * (i + 1),
              width:  b.w,
              height: BLOCK_H,
              backgroundColor: COLORS[i % COLORS.length] + 'CC',
              borderColor:     COLORS[i % COLORS.length],
            }]}>
              <Text style={s.blockLabel}>₪</Text>
            </View>
          ))}

          {/* Moving block */}
          {status === 'running' && (
            <View style={[s.block, s.blockMoving, {
              left:   snap.moving.x - snap.moving.w / 2,
              top:    H - BLOCK_H * (stackLen + 1),
              width:  snap.moving.w,
              height: BLOCK_H,
              backgroundColor: COLORS[stackLen % COLORS.length] + 'AA',
              borderColor:     COLORS[stackLen % COLORS.length],
            }]}>
              <Text style={s.blockLabel}>₪</Text>
            </View>
          )}

          {status === 'idle' && (
            <View style={s.overlay}>
              <Text style={s.overlayEmoji}>🏗️</Text>
              <Text style={s.overlayTitle}>מגדל החיסכון</Text>
              <Text style={s.overlayHint}>לחץ כשהבלוק מעל המגדל{'\n'}הבלוק ייחתך לפי הדיוק שלך{'\n'}{MAX_BLOCKS} קומות לניצחון</Text>
              <View style={s.overlayBtn}><Text style={s.overlayBtnText}>לחץ להתחיל</Text></View>
            </View>
          )}

          {status === 'dead' && (
            <View style={s.overlay}>
              <Text style={s.overlayEmoji}>💥</Text>
              <Text style={s.overlayTitle}>המגדל קרס!</Text>
              <Text style={s.overlayHint}>הגעת לקומה {score}</Text>
              <View style={s.overlayBtn}><Text style={s.overlayBtnText}>נסה שוב</Text></View>
            </View>
          )}

          {status === 'done' && (
            <View style={s.overlay}>
              <Text style={s.overlayEmoji}>🏆</Text>
              <Text style={s.overlayTitle}>מגדל מושלם!</Text>
              <Text style={s.overlayHint}>{MAX_BLOCKS} קומות של חיסכון!</Text>
              <Text style={s.overlayNote}>ממשיך...</Text>
            </View>
          )}
        </View>
        {status === 'running' && <Text style={s.hint}>לחץ לשחרר</Text>}
      </View>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  wrapper: { width: W, alignSelf: 'center' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  dotsRow: { flexDirection: 'row', gap: 5 },
  dot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#222' },
  dotDone: { backgroundColor: '#D4AF37' },

  game: {
    width: W, height: H,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 2, borderColor: '#1A1A2A',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute', left: 0, right: 0,
    height: 1, backgroundColor: 'rgba(255,255,255,0.03)',
  },

  block: {
    position: 'absolute',
    borderWidth: 1, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  blockMoving: {
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 4,
  },
  blockLabel: { color: '#FFF', fontSize: 13, fontWeight: '900' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,10,0.88)',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn: {
    marginTop: 8, backgroundColor: 'rgba(212,175,55,0.18)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.45)',
    paddingHorizontal: 28, paddingVertical: 12,
  },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  hint: { textAlign: 'center', color: '#555', fontSize: 12, marginTop: 8 },
});
