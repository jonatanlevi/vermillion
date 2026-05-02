import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W          = SW - 48;
const H          = 300;
const BALL_R     = 10;
const PADDLE_W   = 80;
const PADDLE_H   = 14;
const PADDLE_Y   = H - 24;
const PADDLE_SPD = 38;
const WIN_HITS   = 25;

export default function PingPongGame({ onFinish }) {
  const [status, setStatus]     = useState('idle');
  const [hits, setHits]         = useState(0);
  const [snap, setSnap]         = useState({ bx: W / 2, by: H / 2, px: W / 2 - PADDLE_W / 2 });

  const bx = useRef(W / 2);
  const by = useRef(H / 2);
  const vx = useRef(3.2);
  const vy = useRef(3.8);
  const px = useRef(W / 2 - PADDLE_W / 2);
  const hitsRef   = useRef(0);
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
    setTimeout(() => onFinish(hitsRef.current), 800);
  }, [onFinish]);

  const startLoop = useCallback(() => {
    loopRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;

      bx.current += vx.current;
      by.current += vy.current;

      // Wall bounces
      if (bx.current - BALL_R < 0)  { bx.current = BALL_R; vx.current =  Math.abs(vx.current); }
      if (bx.current + BALL_R > W)  { bx.current = W - BALL_R; vx.current = -Math.abs(vx.current); }
      if (by.current - BALL_R < 0)  { by.current = BALL_R; vy.current =  Math.abs(vy.current); }

      // Paddle hit
      if (
        vy.current > 0 &&
        by.current + BALL_R >= PADDLE_Y &&
        by.current + BALL_R <= PADDLE_Y + PADDLE_H &&
        bx.current >= px.current - 4 &&
        bx.current <= px.current + PADDLE_W + 4
      ) {
        vy.current = -Math.abs(vy.current);
        const offset = (bx.current - (px.current + PADDLE_W / 2)) / (PADDLE_W / 2);
        vx.current = offset * 4.5;
        hitsRef.current += 1;
        setHits(hitsRef.current);
        // Speed up every 5 hits
        if (hitsRef.current % 5 === 0) {
          const spd = Math.sqrt(vx.current ** 2 + vy.current ** 2);
          const boost = 1.12;
          vx.current *= boost;
          vy.current  = -Math.abs(vy.current) * boost;
          const maxSpd = 9;
          if (spd * boost > maxSpd) {
            vx.current = (vx.current / (spd * boost)) * maxSpd;
            vy.current = (vy.current / (spd * boost)) * maxSpd;
          }
        }
        if (hitsRef.current >= WIN_HITS) { win(); return; }
      }

      // Ball fell
      if (by.current - BALL_R > H) { die(); return; }

      setSnap({ bx: bx.current, by: by.current, px: px.current });
    }, 16);
  }, [die, win]);

  const moveLeft  = () => { px.current = Math.max(0, px.current - PADDLE_SPD); };
  const moveRight = () => { px.current = Math.min(W - PADDLE_W, px.current + PADDLE_SPD); };

  const startGame = () => {
    clearInterval(loopRef.current);
    bx.current = W / 2; by.current = H / 2;
    vx.current = 3.2 * (Math.random() > 0.5 ? 1 : -1);
    vy.current = 3.8;
    px.current = W / 2 - PADDLE_W / 2;
    hitsRef.current = 0;
    statusRef.current = 'running';
    setHits(0);
    setStatus('running');
    setSnap({ bx: bx.current, by: by.current, px: px.current });
    startLoop();
  };

  useEffect(() => () => clearInterval(loopRef.current), []);

  const speedLevel = Math.min(5, Math.floor(hits / 5) + 1);

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>🏓 {hits} / {WIN_HITS}</Text>
          <Text style={s.speedText}>{'⚡'.repeat(speedLevel)}</Text>
        </View>
      )}

      <View style={s.game}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050A14' }]} />

        {/* Court lines */}
        <View style={s.centerLine} />
        {[...Array(6)].map((_, i) => (
          <View key={i} style={[s.courtDot, { left: i * (W / 5) + 20, top: H / 2 - 2 }]} />
        ))}

        {status === 'running' && (
          <>
            {/* Ball */}
            <View style={[s.ball, {
              left: snap.bx - BALL_R,
              top:  snap.by - BALL_R,
            }]} />

            {/* Paddle */}
            <View style={[s.paddle, { left: snap.px, top: PADDLE_Y }]} />

            {/* Progress bar */}
            <View style={[s.progressBar, { width: (hits / WIN_HITS) * W }]} />
          </>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🏓</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'מנצח הריבית' : 'הכדור נפל!'}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `הנח לכדור לקפץ — אל תתן לו ליפול\n${WIN_HITS} קפיצות לניצחון`
                : `הגעת ל-${hits} קפיצות`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}

        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>כל הכבוד!</Text>
            <Text style={s.overlayHint}>{WIN_HITS} קפיצות מושלמות!</Text>
            <Text style={s.overlayNote}>ממשיך...</Text>
          </View>
        )}
      </View>

      {status === 'running' && (
        <View style={s.controls}>
          <TouchableOpacity onPressIn={moveLeft}  onPress={moveLeft}  style={s.ctrlBtn} activeOpacity={0.7}>
            <Text style={s.ctrlLabel}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPressIn={moveRight} onPress={moveRight} style={s.ctrlBtn} activeOpacity={0.7}>
            <Text style={s.ctrlLabel}>→</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { width: W, alignSelf: 'center' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  speedText: { fontSize: 14 },

  game: {
    width: W, height: H,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 2, borderColor: '#1A2A3A',
    position: 'relative',
  },
  centerLine: {
    position: 'absolute', top: H / 2 - 1, left: 0, right: 0,
    height: 1, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  courtDot: {
    position: 'absolute', width: 5, height: 5,
    borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ball: {
    position: 'absolute',
    width: BALL_R * 2, height: BALL_R * 2,
    borderRadius: BALL_R,
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 8, elevation: 6,
  },
  paddle: {
    position: 'absolute',
    width: PADDLE_W, height: PADDLE_H,
    borderRadius: 7,
    backgroundColor: '#C0392B',
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 8, elevation: 4,
  },
  progressBar: {
    position: 'absolute', bottom: 0, left: 0,
    height: 3, backgroundColor: '#D4AF37', opacity: 0.6,
  },

  controls: { flexDirection: 'row', marginTop: 12, gap: 12 },
  ctrlBtn: {
    flex: 1, height: 52,
    backgroundColor: '#161622',
    borderRadius: 14, borderWidth: 1, borderColor: '#2A2A4A',
    alignItems: 'center', justifyContent: 'center',
  },
  ctrlLabel: { color: '#FFF', fontSize: 26, fontWeight: '900' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,5,15,0.88)',
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
