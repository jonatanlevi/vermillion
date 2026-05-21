import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const ROUNDS = 8;
const STEPS  = 4;

function genChain(round) {
  const mult = Math.min(1 + Math.floor(round / 2), 5);
  let start = (Math.floor(Math.random() * 10) + 1) * 100 * mult;
  let correct = start;
  const ops = [];
  for (let i = 0; i < STEPS; i++) {
    const add = Math.random() > 0.4;
    const d   = (Math.floor(Math.random() * 5) + 1) * 100 * mult;
    if (add) { ops.push({ op: '+', delta: d }); correct += d; }
    else      { ops.push({ op: '-', delta: d }); correct = Math.max(100, correct - d); }
  }
  const err = (Math.floor(Math.random() * 3) + 1) * 100 * mult;
  const sign = Math.random() > 0.5 ? 1 : -1;
  const choices = [correct, correct + err * sign, correct - err * sign]
    .map(v => Math.max(100, v))
    .sort(() => Math.random() - 0.5);
  return { start, ops, correct, choices };
}

export default function MathChainGame({ onFinish }) {
  const [status,  setStatus]  = useState('idle');
  const [round,   setRound]   = useState(0);
  const [chain,   setChain]   = useState(null);
  const [step,    setStep]    = useState(0);
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
    setTimeout(() => onFinish(scoreRef.current * 15), 800);
  }, [onFinish]);

  function startRound(r) {
    clearTimeout(timerRef.current);
    const c = genChain(r);
    roundRef.current = r;
    setRound(r); setChain(c); setStep(0); setFlash(null);

    // Auto-advance through steps
    let s = 0;
    function tick() {
      if (statusRef.current !== 'running') return;
      s += 1;
      if (s < STEPS) {
        setStep(s);
        timerRef.current = setTimeout(tick, 800);
      } else {
        setStep(STEPS);
      }
    }
    timerRef.current = setTimeout(tick, 900);
  }
  startRoundRef.current = startRound;

  const answer = useCallback((val) => {
    if (statusRef.current !== 'running' || !chain || step < STEPS) return;
    clearTimeout(timerRef.current);
    if (val === chain.correct) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
    } else {
      setFlash('miss');
    }
    timerRef.current = setTimeout(() => {
      if (statusRef.current !== 'running') return;
      setFlash(null);
      const nr = roundRef.current + 1;
      if (nr >= ROUNDS) { win(); return; }
      startRoundRef.current(nr);
    }, 700);
  }, [chain, step, win]);

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
          <Text style={s.scoreText}>🧮 {round + 1} / {ROUNDS}</Text>
          <Text style={s.pts}>⭐ {score} נכונות</Text>
        </View>
      )}

      <View style={[s.game, { borderColor }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060A10' }]} />

        {status === 'running' && chain && (
          <View style={s.inner}>
            <Text style={s.label}>עקוב אחרי הסכום</Text>

            <View style={s.chainDisplay}>
              <Text style={s.startVal}>₪{chain.start.toLocaleString()}</Text>
              {chain.ops.slice(0, step > 0 ? step : 0).map((op, i) => (
                <Text key={i} style={[s.opText, op.op === '+' ? s.opPlus : s.opMinus]}>
                  {op.op} ₪{op.delta.toLocaleString()}
                </Text>
              ))}
              {step < STEPS && chain.ops[step] && (
                <Text style={[s.opText, s.opCurrent]}>
                  {chain.ops[step].op} ₪{chain.ops[step].delta.toLocaleString()}
                </Text>
              )}
            </View>

            {step >= STEPS && !flash && (
              <View style={s.choicesWrap}>
                {chain.choices.map((c, i) => (
                  <TouchableOpacity key={i} onPress={() => answer(c)} style={s.choiceBtn} activeOpacity={0.7}>
                    <Text style={s.choiceText}>₪{c.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {flash && (
              <Text style={[s.flashText, { color: flash === 'hit' ? '#2ECC71' : '#E74C3C' }]}>
                {flash === 'hit' ? '✅ נכון!' : `❌ התשובה: ₪${chain.correct.toLocaleString()}`}
              </Text>
            )}
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🧮</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'שרשרת חשבון' : 'נסה שוב!'}</Text>
            <Text style={s.overlayHint}>{`פעולות מתחלפות — עקוב אחרי הסכום\n${STEPS} פעולות, ואז ענה\n${ROUNDS} סיבובים`}</Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'שחק שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>חשבון מנטלי!</Text>
            <Text style={s.overlayHint}>{score} / {ROUNDS} שרשראות נכונות!</Text>
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
  inner:     { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 20 },
  label:     { color: '#888', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  chainDisplay: { alignItems: 'center', gap: 6, minHeight: 120 },
  startVal:  { color: '#FFF', fontSize: 28, fontWeight: '900' },
  opText:    { fontSize: 20, fontWeight: '800' },
  opPlus:    { color: '#2ECC71' },
  opMinus:   { color: '#E74C3C' },
  opCurrent: { color: '#D4AF37' },
  choicesWrap: { width: '100%', gap: 8 },
  choiceBtn:   { backgroundColor: '#111830', borderRadius: 14, borderWidth: 1, borderColor: '#2A2A5A', paddingVertical: 12, alignItems: 'center' },
  choiceText:  { color: '#D4AF37', fontSize: 18, fontWeight: '900' },
  flashText:   { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
