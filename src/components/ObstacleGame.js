import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableWithoutFeedback,
  TouchableOpacity, Dimensions,
} from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 320;
const BIRD_X = 70;
const BIRD_R = 16;
const PIPE_W = 52;
const GAP = 130;
const GRAVITY = 0.38;
const JUMP = -7.5;
const PIPE_SPEED = 2.8;
const PIPE_INTERVAL = W * 0.72;

function makePipe(x) {
  const gapTop = 60 + Math.random() * (H - GAP - 100);
  return { x, gapTop, passed: false, id: Math.random() };
}

export default function ObstacleGame({ onFinish }) {
  const [status, setStatus] = useState('idle'); // idle | running | dead | done
  const [score, setScore] = useState(0);

  // All game state in refs — no re-renders in game loop
  const birdY = useRef(H / 2);
  const vel = useRef(0);
  const pipes = useRef([makePipe(W + 60), makePipe(W + 60 + PIPE_INTERVAL)]);
  const scoreRef = useRef(0);
  const statusRef = useRef('idle');
  const loopRef = useRef(null);

  // Canvas-like render using state snapshot every frame
  const [snap, setSnap] = useState({ birdY: H / 2, pipes: pipes.current });

  const startLoop = useCallback(() => {
    loopRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;

      // Physics
      vel.current += GRAVITY;
      birdY.current += vel.current;

      // Move pipes
      pipes.current = pipes.current.map((p) => ({ ...p, x: p.x - PIPE_SPEED }));

      // Recycle pipes
      pipes.current = pipes.current.map((p) => {
        if (p.x + PIPE_W < 0) return makePipe(p.x + PIPE_INTERVAL * 2);
        return p;
      });

      // Score
      pipes.current = pipes.current.map((p) => {
        if (!p.passed && p.x + PIPE_W < BIRD_X) {
          scoreRef.current += 1;
          setScore(scoreRef.current);
          return { ...p, passed: true };
        }
        return p;
      });

      // Collision — ground / ceiling
      if (birdY.current + BIRD_R > H || birdY.current - BIRD_R < 0) {
        die(); return;
      }

      // Collision — pipes
      for (const p of pipes.current) {
        const inX = BIRD_X + BIRD_R > p.x + 4 && BIRD_X - BIRD_R < p.x + PIPE_W - 4;
        const inY = birdY.current - BIRD_R < p.gapTop || birdY.current + BIRD_R > p.gapTop + GAP;
        if (inX && inY) { die(); return; }
      }

      // Win condition
      if (scoreRef.current >= 8) {
        clearInterval(loopRef.current);
        statusRef.current = 'done';
        setStatus('done');
        setTimeout(() => onFinish(scoreRef.current), 800);
        return;
      }

      setSnap({ birdY: birdY.current, pipes: [...pipes.current] });
    }, 16);
  }, []);

  const die = () => {
    clearInterval(loopRef.current);
    statusRef.current = 'dead';
    setStatus('dead');
    setSnap((s) => ({ ...s }));
  };

  const flap = useCallback(() => {
    if (statusRef.current === 'running') {
      vel.current = JUMP;
    }
  }, []);

  const startGame = () => {
    birdY.current = H / 2;
    vel.current = 0;
    scoreRef.current = 0;
    pipes.current = [makePipe(W + 60), makePipe(W + 60 + PIPE_INTERVAL)];
    statusRef.current = 'running';
    setScore(0);
    setStatus('running');
    setSnap({ birdY: H / 2, pipes: pipes.current });
    startLoop();
  };

  const handlePress = () => {
    if (status === 'idle' || status === 'dead') { startGame(); return; }
    flap();
  };

  useEffect(() => () => clearInterval(loopRef.current), []);

  // Bird tilt based on velocity
  const birdTilt = Math.max(-25, Math.min(40, vel.current * 4));
  const birdColor = status === 'dead' ? '#888' : '#F1C40F';

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.wrapper}>

        {/* Score */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>🏅 {score} / 8</Text>
          {status === 'running' && (
            <View style={styles.progressPipesRow}>
              {[...Array(8)].map((_, i) => (
                <View key={i} style={[styles.pipeDot, i < score && styles.pipeDotDone]} />
              ))}
            </View>
          )}
        </View>

        {/* Game area */}
        <View style={styles.game}>

          {/* Sky */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#87CEEB' }]} />

          {/* Clouds */}
          <Cloud x={40} y={30} w={80} />
          <Cloud x={180} y={18} w={60} />
          <Cloud x={W - 100} y={35} w={70} />

          {/* Pipes */}
          {snap.pipes.map((p) => (
            <React.Fragment key={p.id}>
              {/* Top pipe */}
              <View style={[styles.pipe, { left: p.x, top: 0, height: p.gapTop }]}>
                <View style={styles.pipeCap} />
              </View>
              {/* Bottom pipe */}
              <View style={[styles.pipe, { left: p.x, top: p.gapTop + GAP, bottom: 0 }]}>
                <View style={[styles.pipeCap, styles.pipeCapBottom]} />
              </View>
            </React.Fragment>
          ))}

          {/* Ground */}
          <View style={styles.ground}>
            <View style={styles.groundGrass} />
          </View>

          {/* Bird */}
          <View
            style={[
              styles.bird,
              {
                top: snap.birdY - BIRD_R,
                left: BIRD_X - BIRD_R,
                transform: [{ rotate: `${birdTilt}deg` }],
                backgroundColor: birdColor,
              },
            ]}
          >
            <View style={styles.birdWing} />
            <View style={styles.birdEye} />
            <View style={styles.birdBeak} />
          </View>

          {/* IDLE */}
          {status === 'idle' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayBird}>🐦</Text>
              <Text style={styles.overlayTitle}>Flappy VerMillion</Text>
              <Text style={styles.overlayHint}>לחץ לטוס בין הצינורות{'\n'}עבור 8 צינורות לסיום</Text>
              <View style={styles.overlayBtn}>
                <Text style={styles.overlayBtnText}>לחץ לאיפשהו להתחיל</Text>
              </View>
            </View>
          )}

          {/* DEAD */}
          {status === 'dead' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayBird}>💥</Text>
              <Text style={styles.overlayTitle}>נפלת!</Text>
              <Text style={styles.overlayHint}>עברת {score} צינורות</Text>
              <View style={styles.overlayBtn}>
                <Text style={styles.overlayBtnText}>לחץ לנסות שוב</Text>
              </View>
            </View>
          )}

          {/* DONE */}
          {status === 'done' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayBird}>🏁</Text>
              <Text style={styles.overlayTitle}>כל הכבוד!</Text>
              <Text style={styles.overlayHint}>עברת את כל 8 הצינורות!</Text>
              <Text style={styles.overlayNote}>עובר לחתימת זמן...</Text>
            </View>
          )}
        </View>

        {status === 'running' && (
          <Text style={styles.hint}>לחץ לטוס</Text>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

function Cloud({ x, y, w }) {
  return (
    <View style={{ position: 'absolute', left: x, top: y, width: w }}>
      <View style={{ position: 'absolute', bottom: 0, width: w, height: 14, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 10 }} />
      <View style={{ position: 'absolute', bottom: 8, left: w * 0.2, width: w * 0.5, height: 18, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12 }} />
      <View style={{ position: 'absolute', bottom: 10, left: w * 0.38, width: w * 0.35, height: 20, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: W, alignSelf: 'center' },

  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  scoreText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  progressPipesRow: { flexDirection: 'row', gap: 5 },
  pipeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#333' },
  pipeDotDone: { backgroundColor: '#2ECC71' },

  game: {
    width: W, height: H,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1A4A6A',
    position: 'relative',
  },

  // Pipes
  pipe: {
    position: 'absolute',
    width: PIPE_W,
    backgroundColor: '#27AE60',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#1A7A40',
  },
  pipeCap: {
    position: 'absolute',
    bottom: 0,
    left: -8,
    width: PIPE_W + 16,
    height: 18,
    backgroundColor: '#2ECC71',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1A7A40',
  },
  pipeCapBottom: {
    bottom: undefined,
    top: 0,
  },

  // Ground
  ground: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 36,
    backgroundColor: '#8B5E3C',
  },
  groundGrass: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 10,
    backgroundColor: '#5CB85C',
  },

  // Bird
  bird: {
    position: 'absolute',
    width: BIRD_R * 2,
    height: BIRD_R * 2,
    borderRadius: BIRD_R,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  birdWing: {
    position: 'absolute',
    top: 8, left: -6,
    width: 14, height: 8,
    backgroundColor: '#E67E22',
    borderRadius: 6,
  },
  birdEye: {
    position: 'absolute',
    top: 5, right: 5,
    width: 7, height: 7,
    backgroundColor: '#FFF',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  birdBeak: {
    position: 'absolute',
    right: -6, top: 14,
    width: 10, height: 6,
    backgroundColor: '#E74C3C',
    borderRadius: 3,
  },

  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,10,30,0.80)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  overlayBird: { fontSize: 48 },
  overlayTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  overlayHint: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote: { color: '#2ECC71', fontSize: 14, marginTop: 4 },
  overlayBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  hint: { textAlign: 'center', color: '#555', fontSize: 12, marginTop: 8 },
});
