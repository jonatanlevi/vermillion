import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const ROUNDS     = 8;
const BASE_SPEED = 12;
const ZONE_SIZE  = 14;

function genZone() {
  const center = Math.floor(Math.random() * 60) + 20;
  return { from: center - ZONE_SIZE / 2, to: center + ZONE_SIZE / 2 };
}

export default function NumberLineGame({ onFinish }) {
  const [status,  setStatus]  = useState('idle');
  const [round,   setRound]   = useState(0);
  const [pos,     setPos]     = useState(0);
  const [zone,    setZone]    = useState({ from: 40, to: 54 });
  const [flash,   setFlash]   = useState(null);
  const [score,   setScore]   = useState(0);

  const roundRef   = useRef(0);
  const posRef     = useRef(0);
  const dirRef     = useRef(1);
  const scoreRef   = useRef(0);
  const statusRef  = useRef('idle');
  const tickRef    = useRef(null);
  const timerRef   = useRef(null);
  const zoneRef    = useRef({ from: 40, to: 54 });
  const startRoundRef = useRef(null);

  const win = useCallback(() => {
    clearInterval(tickRef.current);
    clearTimeout(timerRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current * 12), 800);
  }, [onFinish]);

  function startRound(r) {
    clearInterval(tickRef.current);
    clearTimeout(timerRef.current);
    const z = genZone();
    zoneRef.current  = z;
    roundRef.current = r;
    posRef.current   = 0;
    dirRef.current   = 1;
    setZone(z); setRound(r); setPos(0); setFlash(null);

    const speed = Math.max(6, BASE_SPEED - r * 1);
    tickRef.current = setInterval(() => {
      posRef.current += dirRef.current;
      if (posRef.current >= 100) { posRef.current = 100; dirRef.current = -1; }
      if (posRef.current <= 0)   { posRef.current = 0;   dirRef.current =  1; }
      setPos(posRef.current);
    }, speed);
  }
  startRoundRef.current = startRound;

  const tap = useCallback(() => {
    if (statusRef.current !== 'running') return;
    clearInterval(tickRef.current);
    const p = posRef.current;
    const inZone = p >= zoneRef.current.from && p <= zoneRef.current.to;

    if (inZone) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
    } else {
      setFlash('miss');
    }

    timerRef.current = setTimeout(() => {
      setFlash(null);
      const next = roundRef.current + 1;
      if (next >= ROUNDS) { win(); return; }
      startRoundRef.current(next);
    }, 700);
  }, [win]);

  const startGame = () => {
    clearInterval(tickRef.current);
    clearTimeout(timerRef.current);
    scoreRef.current  = 0;
    statusRef.current = 'running';
    setScore(0); setFlash(null);
    setStatus('running');
    startRoundRef.current(0);
  };

  useEffect(() => () => { clearInterval(tickRef.current); clearTimeout(timerRef.current); }, []);

  const borderColor = flash === 'hit' ? '#2ECC71' : flash === 'miss' ? '#E74C3C' : '#1A1A2A';
  const markerColor = flash === 'hit' ? '#2ECC71' : flash === 'miss' ? '#E74C3C' : '#FFF';

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>📏 {round + 1} / {ROUNDS}</Text>
          <Text style={s.pts}>⭐ {score} פגיעות</Text>
        </View>
      )}

      <View style={[s.game, { borderColor }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060A10' }]} />

        {status === 'running' && (
          <TouchableOpacity style={s.inner} onPress={tap} activeOpacity={1}>
            <Text style={s.label}>הקש כשהסמן בתוך ה-🟢</Text>

            <View style={s.track}>
              <View style={[
                s.greenZone,
                { left: `${zone.from}%`, width: `${zone.to - zone.from}%` }
              ]} />
              <View style={[
                s.marker,
                { left: `${pos}%`, backgroundColor: markerColor }
              ]} />
            </View>

            {flash && (
              <Text style={[s.flashText, { color: flash === 'hit' ? '#2ECC71' : '#E74C3C' }]}>
                {flash === 'hit' ? '🎯 פגע!' : '❌ החטיא'}
              </Text>
            )}

            {!flash && (
              <View style={s.tapBtn}>
                <Text style={s.tapBtnText}>⛔ הקש!</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>📏</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'קו מספרים' : 'נסה שוב!'}</Text>
            <Text style={s.overlayHint}>
              {`סמן נע על הקו\nהקש כשהוא בתוך האזור הירוק\n${ROUNDS} סיבובים`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'שחק שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>מדויק!</Text>
            <Text style={s.overlayHint}>{score} / {ROUNDS} פגיעות!</Text>
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
  inner:     { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 24 },
  label:     { color: '#888', fontSize: 13, fontWeight: '700' },
  track:     { width: '100%', height: 24, backgroundColor: '#111830', borderRadius: 12, position: 'relative', overflow: 'visible' },
  greenZone: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(46,204,113,0.35)', borderRadius: 12, borderWidth: 2, borderColor: '#2ECC71' },
  marker:    { position: 'absolute', top: -8, width: 6, height: 40, borderRadius: 3, marginLeft: -3 },
  flashText: { fontSize: 22, fontWeight: '900' },
  tapBtn:    { backgroundColor: '#C0392B', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48 },
  tapBtnText:{ color: '#FFF', fontSize: 18, fontWeight: '900' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
