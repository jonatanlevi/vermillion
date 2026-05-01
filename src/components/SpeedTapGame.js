import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 320;
const WIN_COUNT = 15;
const MAX_MISS  = 4;
const TARGET_R  = 28;

const TARGETS = [
  { label: 'חסוך', color: '#2ECC71', good: true  },
  { label: 'השקע', color: '#3498DB', good: true  },
  { label: 'תכנן', color: '#D4AF37', good: true  },
  { label: 'חוב',  color: '#C0392B', good: false },
  { label: 'בזבז', color: '#E67E22', good: false },
];

let _tid = 0;
function makeTarget(score) {
  const t = TARGETS[Math.floor(Math.random() * TARGETS.length)];
  const lane = Math.floor(Math.random() * 4); // 4 horizontal lanes
  const laneH = (H - 40) / 4;
  return {
    id: ++_tid,
    label: t.label,
    color: t.color,
    good: t.good,
    x: -TARGET_R * 2,
    y: 20 + lane * laneH + laneH / 2,
    speed: 1.8 + score * 0.07 + Math.random() * 0.6,
  };
}

export default function SpeedTapGame({ onFinish }) {
  const [status, setStatus]   = useState('idle');
  const [score, setScore]     = useState(0);
  const [misses, setMisses]   = useState(0);
  const [snap, setSnap]       = useState([]);

  const targetsRef  = useRef([]);
  const tappedIds   = useRef(new Set());
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
      if (targetsRef.current.length < 3) {
        targetsRef.current = [...targetsRef.current, makeTarget(scoreRef.current)];
      }
    }, 900);

    loopRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;

      targetsRef.current = targetsRef.current
        .filter(t => !tappedIds.current.has(t.id))
        .map(t => ({ ...t, x: t.x + t.speed }));

      const escaped = targetsRef.current.filter(t => t.x - TARGET_R > W);
      if (escaped.length > 0) {
        const goodEscaped = escaped.filter(t => t.good).length;
        targetsRef.current = targetsRef.current.filter(t => t.x - TARGET_R <= W);
        if (goodEscaped > 0) {
          missRef.current += goodEscaped;
          setMisses(missRef.current);
          if (missRef.current >= MAX_MISS) { die(); return; }
        }
      }

      setSnap([...targetsRef.current]);
    }, 16);
  }, [die]);

  const tapTarget = useCallback((id, good) => {
    if (statusRef.current !== 'running') return;
    if (tappedIds.current.has(id)) return;
    tappedIds.current.add(id);

    if (good) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      if (scoreRef.current >= WIN_COUNT) win();
    } else {
      missRef.current += 1;
      setMisses(missRef.current);
      if (missRef.current >= MAX_MISS) die();
    }
  }, [win, die]);

  const startGame = () => {
    clearInterval(loopRef.current);
    clearInterval(spawnRef.current);
    tappedIds.current.clear();
    targetsRef.current = [makeTarget(0), makeTarget(0)];
    scoreRef.current = 0;
    missRef.current  = 0;
    statusRef.current = 'running';
    setScore(0);
    setMisses(0);
    setStatus('running');
    setSnap([...targetsRef.current]);
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
          <Text style={s.scoreText}>⚡ {score} / {WIN_COUNT}</Text>
          <Text style={s.missText}>פספסת: {misses} / {MAX_MISS}</Text>
        </View>
      )}

      <View style={s.game}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060A10' }]} />

        {/* Lane lines */}
        {[1, 2, 3].map(i => (
          <View key={i} style={[s.lane, { top: 20 + i * ((H - 40) / 4) }]} />
        ))}

        {/* Targets */}
        {snap.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => tapTarget(t.id, t.good)}
            activeOpacity={0.5}
            style={[s.target, {
              left: t.x - TARGET_R,
              top:  t.y - TARGET_R,
              borderColor: t.color,
              shadowColor: t.color,
              backgroundColor: t.color + '22',
            }]}
          >
            <Text style={[s.targetLabel, { color: t.color }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Legend */}
        {status === 'running' && (
          <View style={s.legend}>
            <Text style={s.legendGreen}>✅ הקש</Text>
            <Text style={s.legendRed}>❌ הימנע</Text>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableWithoutFeedback onPress={startGame}>
            <View style={s.overlay}>
              <Text style={s.overlayEmoji}>⚡</Text>
              <Text style={s.overlayTitle}>{status === 'idle' ? 'מהירות הכסף' : 'פספסת יותר מדי!'}</Text>
              <Text style={s.overlayHint}>
                {status === 'idle'
                  ? `הקש על חסוך / השקע / תכנן\nהימנע מחוב / בזבז!\n${WIN_COUNT} הצלחות לניצחון`
                  : `הצלחת ${score} פעמים`}
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
            <Text style={s.overlayHint}>רפלקסים פיננסיים מושלמים!</Text>
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
    borderWidth: 2, borderColor: '#1A2A1A',
    position: 'relative',
  },
  lane: {
    position: 'absolute', left: 0, right: 0,
    height: 1, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  target: {
    position: 'absolute',
    width: TARGET_R * 2, height: TARGET_R * 2,
    borderRadius: TARGET_R,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 10, elevation: 6,
  },
  targetLabel: { fontSize: 11, fontWeight: '900', textAlign: 'center' },

  legend: {
    position: 'absolute', bottom: 8, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 24,
  },
  legendGreen: { color: '#2ECC71', fontSize: 12, fontWeight: '700' },
  legendRed:   { color: '#E74C3C', fontSize: 12, fontWeight: '700' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,5,10,0.88)',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn: {
    marginTop: 8, backgroundColor: 'rgba(46,204,113,0.15)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(46,204,113,0.40)',
    paddingHorizontal: 28, paddingVertical: 12,
  },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
