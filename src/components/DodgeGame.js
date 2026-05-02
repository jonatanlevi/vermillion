import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W          = SW - 48;
const H          = 300;
const PLAYER_R   = 16;
const OBS_R      = 14;
const PLAYER_Y   = H - 44;
const PLAYER_SPD = 5;
const WIN_DODGES = 25;
const MAX_HITS   = 3;

let _oid = 0;
function makeObs(score) {
  return {
    id: ++_oid,
    x: OBS_R + Math.random() * (W - OBS_R * 2),
    y: -OBS_R,
    speed: 2.2 + score * 0.08 + Math.random() * 0.8,
    passed: false,
  };
}

export default function DodgeGame({ onFinish }) {
  const [status, setStatus]   = useState('idle');
  const [dodges, setDodges]   = useState(0);
  const [hits, setHits]       = useState(0);
  const [snap, setSnap]       = useState({ px: W / 2, obs: [] });

  const px         = useRef(W / 2);
  const obsRef     = useRef([]);
  const movingDir  = useRef(0);
  const dodgesRef  = useRef(0);
  const hitsRef    = useRef(0);
  const statusRef  = useRef('idle');
  const loopRef    = useRef(null);
  const spawnRef   = useRef(null);

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
    setTimeout(() => onFinish(dodgesRef.current), 800);
  }, [onFinish]);

  const startLoop = useCallback(() => {
    spawnRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;
      if (obsRef.current.length < 4) {
        obsRef.current = [...obsRef.current, makeObs(dodgesRef.current)];
      }
    }, 700);

    loopRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;

      px.current = Math.max(PLAYER_R, Math.min(W - PLAYER_R, px.current + movingDir.current * PLAYER_SPD));

      obsRef.current = obsRef.current.map(o => ({ ...o, y: o.y + o.speed }));

      obsRef.current.forEach(o => {
        if (!o.passed && o.y > PLAYER_Y + PLAYER_R) {
          o.passed = true;
          dodgesRef.current += 1;
          setDodges(dodgesRef.current);
          if (dodgesRef.current >= WIN_DODGES) { win(); return; }
        }
        const dx = Math.abs(px.current - o.x);
        const dy = Math.abs(PLAYER_Y - o.y);
        if (!o.hit && dx < PLAYER_R + OBS_R - 4 && dy < PLAYER_R + OBS_R - 4) {
          o.hit = true;
          hitsRef.current += 1;
          setHits(hitsRef.current);
          if (hitsRef.current >= MAX_HITS) { die(); return; }
        }
      });

      obsRef.current = obsRef.current.filter(o => o.y - OBS_R < H + 10);
      setSnap({ px: px.current, obs: [...obsRef.current] });
    }, 16);
  }, [die, win]);

  const startGame = () => {
    clearInterval(loopRef.current);
    clearInterval(spawnRef.current);
    px.current = W / 2;
    obsRef.current = [];
    movingDir.current = 0;
    dodgesRef.current = 0;
    hitsRef.current   = 0;
    statusRef.current = 'running';
    setDodges(0);
    setHits(0);
    setStatus('running');
    setSnap({ px: W / 2, obs: [] });
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
          <Text style={s.scoreText}>💨 {dodges} / {WIN_DODGES}</Text>
          <View style={s.livesRow}>
            {[...Array(MAX_HITS)].map((_, i) => (
              <Text key={i} style={{ fontSize: 16, opacity: i < (MAX_HITS - hits) ? 1 : 0.15 }}>❤️</Text>
            ))}
          </View>
        </View>
      )}

      <View style={s.game}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#06080E' }]} />
        {[...Array(12)].map((_, i) => (
          <View key={i} style={[s.star, { left: (i*61+9) % (W-4), top: (i*43+7) % (H*0.7) }]} />
        ))}

        {status === 'running' && (
          <>
            {snap.obs.map(o => (
              <View key={o.id} style={[s.obs, {
                left: o.x - OBS_R, top: o.y - OBS_R,
                backgroundColor: o.hit ? '#555' : '#C0392B33',
                borderColor: o.hit ? '#444' : '#C0392B',
                shadowColor: '#C0392B',
              }]}>
                <Text style={s.obsLabel}>💸</Text>
              </View>
            ))}
            <View style={[s.player, { left: snap.px - PLAYER_R, top: PLAYER_Y - PLAYER_R }]}>
              <Text style={s.playerLabel}>₪</Text>
            </View>
          </>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>💨</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'חמוק מהחובות' : 'נפגעת!'}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `חמוק מ-💸 שנופלים עליך\n← → להזזה\n${WIN_DODGES} חמיקות לניצחון`
                : `חמקת ${dodges} פעמים`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>כל הכבוד!</Text>
            <Text style={s.overlayHint}>חמקת מ-{WIN_DODGES} חובות!</Text>
            <Text style={s.overlayNote}>ממשיך...</Text>
          </View>
        )}
      </View>

      {status === 'running' && (
        <View style={s.controls}>
          <TouchableOpacity
            onPressIn={() => { movingDir.current = -1; }}
            onPressOut={() => { if (movingDir.current === -1) movingDir.current = 0; }}
            style={s.ctrlBtn} activeOpacity={0.7}
          >
            <Text style={s.ctrlLabel}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPressIn={() => { movingDir.current = 1; }}
            onPressOut={() => { if (movingDir.current === 1) movingDir.current = 0; }}
            style={s.ctrlBtn} activeOpacity={0.7}
          >
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
  livesRow: { flexDirection: 'row', gap: 4 },
  game: { width: W, height: H, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: '#1A1A2A', position: 'relative' },
  star: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  obs: {
    position: 'absolute', width: OBS_R * 2, height: OBS_R * 2, borderRadius: OBS_R,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8, elevation: 4,
  },
  obsLabel: { fontSize: 16 },
  player: {
    position: 'absolute', width: PLAYER_R * 2, height: PLAYER_R * 2, borderRadius: PLAYER_R,
    backgroundColor: '#D4AF3733', borderWidth: 2, borderColor: '#D4AF37',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 6,
  },
  playerLabel: { fontSize: 14, fontWeight: '900', color: '#D4AF37' },
  controls: { flexDirection: 'row', marginTop: 12, gap: 12 },
  ctrlBtn: { flex: 1, height: 52, backgroundColor: '#161622', borderRadius: 14, borderWidth: 1, borderColor: '#2A2A4A', alignItems: 'center', justifyContent: 'center' },
  ctrlLabel: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint: { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote: { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn: { marginTop: 8, backgroundColor: 'rgba(192,57,43,0.20)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(192,57,43,0.50)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
