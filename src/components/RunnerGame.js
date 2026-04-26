import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions,
} from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 300;

const CHAR_X = W * 0.15;
const CHAR_R = 14;
const GROUND_H = 20;
const GROUND_Y = H - GROUND_H;
const CHAR_GROUND = GROUND_Y - CHAR_R;

const GRAVITY = 0.38;
const JUMP = -7.5;
const OBSTACLE_SPEED = 3;
const WIN_SCORE = 10;

const OBS_TALL_W = 20;
const OBS_TALL_H = 60;
const OBS_WIDE_W = 30;
const OBS_WIDE_H = 30;

function makeObstacle(x) {
  const isTall = Math.random() > 0.5;
  const w = isTall ? OBS_TALL_W : OBS_WIDE_W;
  const h = isTall ? OBS_TALL_H : OBS_WIDE_H;
  return {
    x,
    w,
    h,
    y: GROUND_Y - h,
    isTall,
    passed: false,
    id: Math.random(),
  };
}

function nextObstacleX(prevX, prevW) {
  return prevX + prevW + 300 + Math.random() * 150;
}

export default function RunnerGame({ onFinish }) {
  const [status, setStatus] = useState('idle');
  const [score, setScore] = useState(0);

  const characterY = useRef(CHAR_GROUND);
  const vel = useRef(0);
  const obstacles = useRef([makeObstacle(W + 80)]);
  const scoreRef = useRef(0);
  const statusRef = useRef('idle');
  const loopRef = useRef(null);
  const groundOffset = useRef(0);

  const [snap, setSnap] = useState({
    characterY: CHAR_GROUND,
    obstacles: obstacles.current,
    groundOffset: 0,
  });

  const die = () => {
    clearInterval(loopRef.current);
    statusRef.current = 'dead';
    setStatus('dead');
    setSnap((s) => ({ ...s }));
  };

  const startLoop = useCallback(() => {
    loopRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;

      vel.current += GRAVITY;
      characterY.current += vel.current;

      if (characterY.current >= CHAR_GROUND) {
        characterY.current = CHAR_GROUND;
        vel.current = 0;
      }

      if (characterY.current - CHAR_R < 0) {
        characterY.current = CHAR_R;
        vel.current = 0;
      }

      groundOffset.current = (groundOffset.current + OBSTACLE_SPEED) % 40;

      obstacles.current = obstacles.current.map((o) => ({ ...o, x: o.x - OBSTACLE_SPEED }));

      const last = obstacles.current[obstacles.current.length - 1];
      if (last.x < W * 0.4) {
        obstacles.current = [
          ...obstacles.current,
          makeObstacle(nextObstacleX(last.x, last.w)),
        ];
      }

      obstacles.current = obstacles.current.filter((o) => o.x + o.w > -10);

      obstacles.current = obstacles.current.map((o) => {
        if (!o.passed && o.x + o.w < CHAR_X) {
          scoreRef.current += 1;
          setScore(scoreRef.current);
          return { ...o, passed: true };
        }
        return o;
      });

      for (const o of obstacles.current) {
        const charLeft = CHAR_X - CHAR_R + 4;
        const charRight = CHAR_X + CHAR_R - 4;
        const charTop = characterY.current - CHAR_R + 4;
        const charBottom = characterY.current + CHAR_R - 4;
        const inX = charRight > o.x && charLeft < o.x + o.w;
        const inY = charBottom > o.y && charTop < o.y + o.h;
        if (inX && inY) { die(); return; }
      }

      if (scoreRef.current >= WIN_SCORE) {
        clearInterval(loopRef.current);
        statusRef.current = 'done';
        setStatus('done');
        setTimeout(() => onFinish(scoreRef.current), 800);
        return;
      }

      setSnap({
        characterY: characterY.current,
        obstacles: [...obstacles.current],
        groundOffset: groundOffset.current,
      });
    }, 16);
  }, []);

  const jump = useCallback(() => {
    if (statusRef.current === 'running' && characterY.current >= CHAR_GROUND - 2) {
      vel.current = JUMP;
    }
  }, []);

  const startGame = () => {
    clearInterval(loopRef.current);
    characterY.current = CHAR_GROUND;
    vel.current = 0;
    scoreRef.current = 0;
    groundOffset.current = 0;
    obstacles.current = [makeObstacle(W + 80)];
    statusRef.current = 'running';
    setScore(0);
    setStatus('running');
    setSnap({ characterY: CHAR_GROUND, obstacles: obstacles.current, groundOffset: 0 });
    startLoop();
  };

  const handlePress = () => {
    if (status === 'idle' || status === 'dead') { startGame(); return; }
    jump();
  };

  useEffect(() => () => clearInterval(loopRef.current), []);

  const charColor = status === 'dead' ? '#555' : '#C0392B';

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.wrapper}>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>🏅 {score} / {WIN_SCORE}</Text>
          {status === 'running' && (
            <View style={styles.progressRow}>
              {[...Array(WIN_SCORE)].map((_, i) => (
                <View key={i} style={[styles.dot, i < score && styles.dotDone]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.game}>

          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0D1B2A' }]} />

          <Star x={W * 0.1} y={18} />
          <Star x={W * 0.35} y={30} />
          <Star x={W * 0.6} y={12} />
          <Star x={W * 0.85} y={25} />

          {snap.obstacles.map((o) => (
            <View
              key={o.id}
              style={[
                styles.obstacle,
                {
                  left: o.x,
                  top: o.y,
                  width: o.w,
                  height: o.h,
                  backgroundColor: o.isTall ? '#C0392B' : '#8B0000',
                },
              ]}
            >
              <Text style={styles.obstacleLabel}>{o.isTall ? 'חוב' : 'ריבית'}</Text>
            </View>
          ))}

          <View style={styles.groundContainer}>
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.groundMark,
                  { left: (i * 40 - snap.groundOffset + 40) % (W + 40) - 20 },
                ]}
              />
            ))}
          </View>

          <View
            style={[
              styles.character,
              {
                top: snap.characterY - CHAR_R,
                left: CHAR_X - CHAR_R,
                backgroundColor: charColor,
              },
            ]}
          >
            <Text style={styles.charLabel}>₪</Text>
          </View>

          {status === 'idle' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayEmoji}>✈️</Text>
              <Text style={styles.overlayTitle}>ריצת VerMillion</Text>
              <Text style={styles.overlayHint}>קפוץ מעל החובות והריביות{'\n'}עבור {WIN_SCORE} מכשולים לניצחון</Text>
              <View style={styles.overlayBtn}>
                <Text style={styles.overlayBtnText}>לחץ לאיפשהו להתחיל</Text>
              </View>
            </View>
          )}

          {status === 'dead' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayEmoji}>💥</Text>
              <Text style={styles.overlayTitle}>נפלת!</Text>
              <Text style={styles.overlayHint}>עברת {score} מכשולים</Text>
              <View style={styles.overlayBtn}>
                <Text style={styles.overlayBtnText}>לחץ לנסות שוב</Text>
              </View>
            </View>
          )}

          {status === 'done' && (
            <View style={styles.overlay}>
              <Text style={styles.overlayEmoji}>🏁</Text>
              <Text style={styles.overlayTitle}>כל הכבוד!</Text>
              <Text style={styles.overlayHint}>עברת את כל {WIN_SCORE} המכשולים!</Text>
              <Text style={styles.overlayNote}>ממשיך...</Text>
            </View>
          )}
        </View>

        {status === 'running' && (
          <Text style={styles.hint}>לחץ לקפוץ</Text>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

function Star({ x, y }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.6)',
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: { width: W, alignSelf: 'center' },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  progressRow: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#333' },
  dotDone: { backgroundColor: '#D4AF37' },

  game: {
    width: W,
    height: H,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1A2A3A',
    position: 'relative',
  },

  obstacle: {
    position: 'absolute',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 3,
    borderWidth: 1,
    borderColor: '#FF4D4D',
  },
  obstacleLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },

  groundContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GROUND_H,
    backgroundColor: '#1A3A1A',
    overflow: 'hidden',
  },
  groundMark: {
    position: 'absolute',
    top: 6,
    width: 2,
    height: 8,
    backgroundColor: '#2A5A2A',
  },

  character: {
    position: 'absolute',
    width: CHAR_R * 2,
    height: CHAR_R * 2,
    borderRadius: CHAR_R,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  charLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,5,15,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  overlayHint: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote: { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(192,57,43,0.20)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.50)',
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  hint: { textAlign: 'center', color: '#555', fontSize: 12, marginTop: 8 },
});
