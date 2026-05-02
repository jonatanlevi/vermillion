import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W        = SW - 48;
const H        = 330;
const WIN_COUNT = 18;
const MAX_MISS  = 4;

const PALETTE = [
  { key: 'red',    color: '#E74C3C', label: '🔴', name: 'אדום'   },
  { key: 'gold',   color: '#D4AF37', label: '🟡', name: 'זהוב'   },
  { key: 'green',  color: '#2ECC71', label: '🟢', name: 'ירוק'   },
  { key: 'blue',   color: '#3498DB', label: '🔵', name: 'כחול'   },
  { key: 'purple', color: '#9B59B6', label: '🟣', name: 'סגול'   },
];

let _cid = 0;
function makeCircles(targetKey) {
  const positions = [];
  const cols = 4, rows = 3;
  const cw = (W - 24) / cols;
  const ch = (H - 80) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      positions.push({
        id: ++_cid,
        key: p.key,
        color: p.color,
        label: p.label,
        x: 12 + c * cw + cw / 2,
        y: 72 + r * ch + ch / 2,
        r: 22 + Math.random() * 10,
      });
    }
  }
  // Guarantee at least 2 targets
  let targetCount = positions.filter(p => p.key === targetKey).length;
  if (targetCount < 2) {
    const idx = Math.floor(Math.random() * positions.length);
    const target = PALETTE.find(p => p.key === targetKey);
    positions[idx] = { ...positions[idx], key: target.key, color: target.color, label: target.label };
  }
  return positions;
}

export default function ColorBoomGame({ onFinish }) {
  const [status, setStatus]     = useState('idle');
  const [score, setScore]       = useState(0);
  const [misses, setMisses]     = useState(0);
  const [target, setTarget]     = useState(PALETTE[0]);
  const [circles, setCircles]   = useState([]);
  const [flash, setFlash]       = useState(null);

  const scoreRef  = useRef(0);
  const missRef   = useRef(0);
  const statusRef = useRef('idle');
  const tappedIds = useRef(new Set());
  const targetRef = useRef(PALETTE[0]);

  const pickNewTarget = useCallback((currentCircles) => {
    const newTarget = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    targetRef.current = newTarget;
    setTarget(newTarget);
    const fresh = makeCircles(newTarget.key);
    tappedIds.current.clear();
    setCircles(fresh);
  }, []);

  const tapCircle = useCallback((id, key) => {
    if (statusRef.current !== 'running') return;
    if (tappedIds.current.has(id)) return;
    tappedIds.current.add(id);

    if (key === targetRef.current.key) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('hit');
      setTimeout(() => setFlash(null), 220);
      setCircles(prev => prev.filter(c => c.id !== id));
      if (scoreRef.current >= WIN_COUNT) {
        statusRef.current = 'done';
        setStatus('done');
        setTimeout(() => onFinish(scoreRef.current), 800);
        return;
      }
      // Check if no more targets remain
      setCircles(prev => {
        const remaining = prev.filter(c => c.key === targetRef.current.key && !tappedIds.current.has(c.id));
        if (remaining.length === 0) {
          setTimeout(() => pickNewTarget(), 200);
        }
        return prev.filter(c => c.id !== id);
      });
    } else {
      missRef.current += 1;
      setMisses(missRef.current);
      setFlash('miss');
      setTimeout(() => setFlash(null), 220);
      if (missRef.current >= MAX_MISS) {
        statusRef.current = 'dead';
        setStatus('dead');
      }
    }
  }, [onFinish, pickNewTarget]);

  const startGame = () => {
    const t = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    targetRef.current = t;
    scoreRef.current = 0;
    missRef.current  = 0;
    statusRef.current = 'running';
    tappedIds.current.clear();
    setScore(0);
    setMisses(0);
    setTarget(t);
    setFlash(null);
    setStatus('running');
    setCircles(makeCircles(t.key));
  };

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>💥 {score} / {WIN_COUNT}</Text>
          <View style={s.livesRow}>
            {[...Array(MAX_MISS)].map((_, i) => (
              <Text key={i} style={{ fontSize: 14, opacity: i < (MAX_MISS - misses) ? 1 : 0.15 }}>❤️</Text>
            ))}
          </View>
        </View>
      )}

      <View style={[s.game, flash === 'hit' && s.gameHit, flash === 'miss' && s.gameMiss]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060810' }]} />

        {/* Target instruction */}
        {status === 'running' && (
          <View style={s.targetBar}>
            <Text style={s.targetText}>פוצץ את הצבע:</Text>
            <Text style={s.targetEmoji}>{target.label}</Text>
            <Text style={[s.targetName, { color: target.color }]}>{target.name}</Text>
          </View>
        )}

        {/* Circles */}
        {status === 'running' && circles.map(c => (
          <TouchableOpacity
            key={c.id}
            onPress={() => tapCircle(c.id, c.key)}
            activeOpacity={0.5}
            style={[s.circle, {
              left: c.x - c.r, top: c.y - c.r,
              width: c.r * 2, height: c.r * 2,
              borderRadius: c.r,
              borderColor: c.color,
              backgroundColor: c.color + '25',
              shadowColor: c.color,
            }]}
          >
            <Text style={s.circleLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🎨</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'פוצץ הנכון' : 'יותר מדי שגיאות!'}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `פוצץ רק את הצבע הנדרש\nהימנע מהשאר — ${WIN_COUNT} פיצוצים לניצחון`
                : `פוצצת ${score} נכון`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}

        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>כל הכבוד!</Text>
            <Text style={s.overlayHint}>פוצצת {WIN_COUNT} נכון!</Text>
            <Text style={s.overlayNote}>ממשיך...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { width: W, alignSelf: 'center' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  livesRow: { flexDirection: 'row', gap: 4 },

  game: {
    width: W, height: H,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 2, borderColor: '#1A1A2A',
    position: 'relative',
  },
  gameHit:  { borderColor: '#2ECC71' },
  gameMiss: { borderColor: '#E74C3C' },

  targetBar: {
    position: 'absolute', top: 12, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  targetText:  { color: '#888', fontSize: 14 },
  targetEmoji: { fontSize: 22 },
  targetName:  { fontSize: 16, fontWeight: '900' },

  circle: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 8, elevation: 4,
  },
  circleLabel: { fontSize: 16 },

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
