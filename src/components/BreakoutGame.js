import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 360;

const BALL_R = 8;
const PADDLE_W = 72;
const PADDLE_H = 12;
const PADDLE_Y = H - 40;
const PADDLE_SPEED = 8;
const BALL_SPEED = 3;

const COLS = 4;
const ROWS = 3;
const BLOCK_MARGIN = 4;
const BLOCK_START_Y = 40;
const BLOCK_H = 22;

const ROW_COLORS = ['#C0392B', '#E67E22', '#D4AF37'];
const ROW_LABELS = ['חוב', 'ריבית', 'הוצאה'];

function makeBlocks() {
  const blocks = [];
  const totalMargin = (COLS + 1) * BLOCK_MARGIN;
  const bW = (W - totalMargin) / COLS;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      blocks.push({
        id: r * COLS + c,
        x: BLOCK_MARGIN + c * (bW + BLOCK_MARGIN),
        y: BLOCK_START_Y + r * (BLOCK_H + BLOCK_MARGIN),
        w: bW,
        h: BLOCK_H,
        color: ROW_COLORS[r],
        label: ROW_LABELS[r],
        active: true,
      });
    }
  }
  return blocks;
}

function initBall() {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
  return {
    x: W / 2,
    y: PADDLE_Y - BALL_R - 2,
    vx: Math.cos(angle) * BALL_SPEED,
    vy: Math.sin(angle) * BALL_SPEED,
  };
}

export default function BreakoutGame({ onFinish }) {
  const [status, setStatus] = useState('idle');
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [snap, setSnap] = useState(() => ({
    ballX: W / 2, ballY: PADDLE_Y - BALL_R - 2,
    paddleX: (W - PADDLE_W) / 2,
    blocks: makeBlocks(),
    lives: 3, score: 0,
  }));

  const ballX = useRef(W / 2);
  const ballY = useRef(PADDLE_Y - BALL_R - 2);
  const ballVX = useRef(0);
  const ballVY = useRef(0);
  const paddleX = useRef((W - PADDLE_W) / 2);
  const blocks = useRef(makeBlocks());
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const statusRef = useRef('idle');
  const loopRef = useRef(null);
  const movingLeft = useRef(false);
  const movingRight = useRef(false);

  const pushSnap = useCallback(() => {
    setSnap({
      ballX: ballX.current,
      ballY: ballY.current,
      paddleX: paddleX.current,
      blocks: [...blocks.current],
      lives: livesRef.current,
      score: scoreRef.current,
    });
  }, []);

  const resetBall = useCallback(() => {
    const b = initBall();
    ballX.current = b.x;
    ballY.current = b.y;
    ballVX.current = b.vx;
    ballVY.current = b.vy;
  }, []);

  const startLoop = useCallback(() => {
    loopRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;

      if (movingLeft.current) {
        paddleX.current = Math.max(0, paddleX.current - PADDLE_SPEED);
      }
      if (movingRight.current) {
        paddleX.current = Math.min(W - PADDLE_W, paddleX.current + PADDLE_SPEED);
      }

      ballX.current += ballVX.current;
      ballY.current += ballVY.current;

      if (ballX.current - BALL_R <= 0) {
        ballX.current = BALL_R;
        ballVX.current = Math.abs(ballVX.current);
      }
      if (ballX.current + BALL_R >= W) {
        ballX.current = W - BALL_R;
        ballVX.current = -Math.abs(ballVX.current);
      }
      if (ballY.current - BALL_R <= 0) {
        ballY.current = BALL_R;
        ballVY.current = Math.abs(ballVY.current);
      }

      const px = paddleX.current;
      const py = PADDLE_Y;
      if (
        ballY.current + BALL_R >= py &&
        ballY.current + BALL_R <= py + PADDLE_H + 4 &&
        ballX.current >= px - BALL_R &&
        ballX.current <= px + PADDLE_W + BALL_R &&
        ballVY.current > 0
      ) {
        const hitPos = (ballX.current - (px + PADDLE_W / 2)) / (PADDLE_W / 2);
        ballVX.current = hitPos * BALL_SPEED * 1.2;
        ballVY.current = -Math.abs(ballVY.current);
        const speed = Math.sqrt(ballVX.current ** 2 + ballVY.current ** 2);
        ballVX.current = (ballVX.current / speed) * BALL_SPEED;
        ballVY.current = (ballVY.current / speed) * BALL_SPEED;
        ballY.current = py - BALL_R;
      }

      if (ballY.current - BALL_R > H) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          clearInterval(loopRef.current);
          statusRef.current = 'dead';
          setStatus('dead');
          return;
        }
        resetBall();
        pushSnap();
        return;
      }

      let hitBlock = false;
      const newBlocks = blocks.current.map(b => {
        if (!b.active || hitBlock) return b;
        if (
          ballX.current + BALL_R > b.x &&
          ballX.current - BALL_R < b.x + b.w &&
          ballY.current + BALL_R > b.y &&
          ballY.current - BALL_R < b.y + b.h
        ) {
          hitBlock = true;
          scoreRef.current += 10;
          setScore(scoreRef.current);
          const overlapLeft = ballX.current + BALL_R - b.x;
          const overlapRight = b.x + b.w - (ballX.current - BALL_R);
          const overlapTop = ballY.current + BALL_R - b.y;
          const overlapBottom = b.y + b.h - (ballY.current - BALL_R);
          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);
          if (minOverlapX < minOverlapY) {
            ballVX.current *= -1;
          } else {
            ballVY.current *= -1;
          }
          return { ...b, active: false };
        }
        return b;
      });
      blocks.current = newBlocks;

      if (blocks.current.every(b => !b.active)) {
        clearInterval(loopRef.current);
        statusRef.current = 'done';
        setStatus('done');
        setTimeout(() => onFinish(scoreRef.current), 800);
        return;
      }

      pushSnap();
    }, 16);
  }, [pushSnap, resetBall]);

  const startGame = useCallback(() => {
    clearInterval(loopRef.current);
    livesRef.current = 3;
    scoreRef.current = 0;
    blocks.current = makeBlocks();
    paddleX.current = (W - PADDLE_W) / 2;
    statusRef.current = 'running';
    setLives(3);
    setScore(0);
    setStatus('running');
    resetBall();
    setSnap({
      ballX: ballX.current, ballY: ballY.current,
      paddleX: paddleX.current,
      blocks: [...blocks.current],
      lives: 3, score: 0,
    });
    startLoop();
  }, [resetBall, startLoop]);

  useEffect(() => () => clearInterval(loopRef.current), []);

  return (
    <View style={styles.wrapper}>

      <View style={styles.topRow}>
        <Text style={styles.scoreText}>ניקוד: {score}</Text>
        <View style={styles.livesRow}>
          {[0, 1, 2].map(i => (
            <Text key={i} style={[styles.heart, i >= snap.lives && styles.heartLost]}>❤️</Text>
          ))}
        </View>
      </View>

      <View style={styles.game}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111111' }]} />

        {snap.blocks.map(b => b.active && (
          <View key={b.id} style={[styles.block, { left: b.x, top: b.y, width: b.w, height: b.h, backgroundColor: b.color }]}>
            <Text style={styles.blockLabel}>{b.label}</Text>
          </View>
        ))}

        <View style={[styles.ball, { left: snap.ballX - BALL_R, top: snap.ballY - BALL_R }]} />

        <View style={[styles.paddle, { left: snap.paddleX, top: PADDLE_Y }]} />

        {status === 'idle' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayEmoji}>🧱</Text>
            <Text style={styles.overlayTitle}>שבור את החובות</Text>
            <Text style={styles.overlayHint}>השתמש בכפתורים למטה{'\n'}שבור את כל הבלוקים לניצחון</Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startBtnText}>התחל</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'dead' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayEmoji}>💔</Text>
            <Text style={styles.overlayTitle}>נכנעת לחובות!</Text>
            <Text style={styles.overlayHint}>ניקוד: {score}</Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startBtnText}>נסה שוב</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'done' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayEmoji}>🏆</Text>
            <Text style={styles.overlayTitle}>ניצחת!</Text>
            <Text style={styles.overlayHint}>שברת את כל החובות! ניקוד: {score}</Text>
            <Text style={styles.overlayNote}>ממשיך...</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPressIn={() => { movingLeft.current = true; }}
          onPressOut={() => { movingLeft.current = false; }}
          onPress={() => { paddleX.current = Math.max(0, paddleX.current - PADDLE_SPEED * 3); }}
          activeOpacity={0.7}
        >
          <Text style={styles.ctrlBtnText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPressIn={() => { movingRight.current = true; }}
          onPressOut={() => { movingRight.current = false; }}
          onPress={() => { paddleX.current = Math.min(W - PADDLE_W, paddleX.current + PADDLE_SPEED * 3); }}
          activeOpacity={0.7}
        >
          <Text style={styles.ctrlBtnText}>▶</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: W, alignSelf: 'center' },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  livesRow: { flexDirection: 'row', gap: 4 },
  heart: { fontSize: 16 },
  heartLost: { opacity: 0.2 },

  game: { width: W, height: H, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#1E1E1E', position: 'relative' },

  block: { position: 'absolute', borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)' },
  blockLabel: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  ball: { position: 'absolute', width: BALL_R * 2, height: BALL_R * 2, borderRadius: BALL_R, backgroundColor: '#D4AF37', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 6 },

  paddle: { position: 'absolute', width: PADDLE_W, height: PADDLE_H, backgroundColor: '#C0392B', borderRadius: 6, borderWidth: 1, borderColor: '#FF4D4D' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.84)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint: { color: '#AAA', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  overlayNote: { color: '#D4AF37', fontSize: 14 },
  startBtn: { marginTop: 8, backgroundColor: '#C0392B', borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14 },
  startBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },

  controls: { flexDirection: 'row', gap: 16, marginTop: 14, justifyContent: 'center' },
  ctrlBtn: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1, borderColor: '#2A2A2A', minHeight: 60, alignItems: 'center', justifyContent: 'center' },
  ctrlBtnText: { color: '#C0392B', fontSize: 28, fontWeight: '900' },
});
