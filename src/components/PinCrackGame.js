import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const ROUNDS   = 8;
const FLASH_MS = 1500;

function genPin(len) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10));
}

export default function PinCrackGame({ onFinish }) {
  const [status,  setStatus]  = useState('idle');
  const [round,   setRound]   = useState(0);
  const [pin,     setPin]     = useState([]);
  const [phase,   setPhase]   = useState('show'); // show | enter
  const [entered, setEntered] = useState([]);
  const [flash,   setFlash]   = useState(null);
  const [score,   setScore]   = useState(0);

  const roundRef  = useRef(0);
  const scoreRef  = useRef(0);
  const statusRef = useRef('idle');
  const timerRef  = useRef(null);
  const startRoundRef = useRef(null);

  const win = useCallback(() => {
    clearTimeout(timerRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(scoreRef.current * 12), 800);
  }, [onFinish]);

  function startRound(r) {
    clearTimeout(timerRef.current);
    const len = Math.min(3 + Math.floor(r / 2), 6);
    const p   = genPin(len);
    roundRef.current = r;
    setRound(r); setPin(p); setPhase('show'); setEntered([]); setFlash(null);

    timerRef.current = setTimeout(() => {
      setPhase('enter');
    }, FLASH_MS);
  }
  startRoundRef.current = startRound;

  const pressDigit = useCallback((d) => {
    if (statusRef.current !== 'running' || phase !== 'enter') return;
    setEntered(prev => {
      const next = [...prev, d];
      if (next.length === pin.length) {
        const correct = next.every((v, i) => v === pin[i]);
        if (correct) {
          scoreRef.current += 1;
          setScore(scoreRef.current);
          setFlash('hit');
        } else {
          setFlash('miss');
        }
        timerRef.current = setTimeout(() => {
          setFlash(null);
          const nr = roundRef.current + 1;
          if (nr >= ROUNDS) { win(); return; }
          startRoundRef.current(nr);
        }, 700);
        return next;
      }
      return next;
    });
  }, [phase, pin, win]);

  const pressBack = useCallback(() => {
    if (phase !== 'enter') return;
    setEntered(prev => prev.slice(0, -1));
  }, [phase]);

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
          <Text style={s.scoreText}>🔢 {round + 1} / {ROUNDS}</Text>
          <Text style={s.pts}>⭐ {score} נכונות</Text>
        </View>
      )}

      <View style={[s.game, { borderColor }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060A10' }]} />

        {status === 'running' && (
          <View style={s.inner}>
            {phase === 'show' && (
              <>
                <Text style={s.label}>שנן את הקוד</Text>
                <View style={s.pinRow}>
                  {pin.map((d, i) => (
                    <View key={i} style={s.pinDigitBox}>
                      <Text style={s.pinDigit}>{d}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {phase === 'enter' && (
              <>
                <Text style={s.label}>הכנס את הקוד</Text>
                <View style={s.pinRow}>
                  {Array.from({ length: pin.length }).map((_, i) => (
                    <View key={i} style={[s.pinDigitBox, entered[i] !== undefined && s.pinFilled]}>
                      <Text style={s.pinDigit}>{entered[i] !== undefined ? entered[i] : '·'}</Text>
                    </View>
                  ))}
                </View>
                {flash && (
                  <Text style={[s.flashText, { color: flash === 'hit' ? '#2ECC71' : '#E74C3C' }]}>
                    {flash === 'hit' ? '✅ נכון!' : '❌ שגוי'}
                  </Text>
                )}
                {!flash && (
                  <View style={s.pad}>
                    {[1,2,3,4,5,6,7,8,9,'←',0,'✓'].map((k, i) => (
                      <TouchableOpacity
                        key={i}
                        style={s.padKey}
                        onPress={() => k === '←' ? pressBack() : k === '✓' ? null : pressDigit(k)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.padKeyText, k === '←' && { color: '#E74C3C' }]}>{k}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🔢</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'פצח את הקוד' : 'נסה שוב!'}</Text>
            <Text style={s.overlayHint}>{`קוד מבזיק לשנייה וחצי\nזכור והכנס\n${ROUNDS} סיבובים`}</Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'שחק שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>זיכרון ברזל!</Text>
            <Text style={s.overlayHint}>{score} / {ROUNDS} קודים נכונים!</Text>
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
  inner:     { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 16 },
  label:     { color: '#888', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  pinRow:    { flexDirection: 'row', gap: 10 },
  pinDigitBox: { width: 40, height: 52, borderRadius: 10, backgroundColor: '#111830', borderWidth: 2, borderColor: '#2A2A5A', alignItems: 'center', justifyContent: 'center' },
  pinFilled:   { borderColor: '#D4AF37' },
  pinDigit:    { color: '#D4AF37', fontSize: 26, fontWeight: '900' },
  flashText:   { fontSize: 20, fontWeight: '900' },
  pad:       { flexDirection: 'row', flexWrap: 'wrap', width: '80%', gap: 8, justifyContent: 'center' },
  padKey:    { width: 56, height: 40, borderRadius: 10, backgroundColor: '#111830', borderWidth: 1, borderColor: '#2A2A5A', alignItems: 'center', justifyContent: 'center' },
  padKeyText:{ color: '#FFF', fontSize: 18, fontWeight: '700' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
