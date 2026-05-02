import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W         = SW - 48;
const H         = 310;
const LANES     = 3;
const LANE_W    = W / LANES;
const BASKET_W  = LANE_W * 0.68;
const BASKET_H  = 28;
const ITEM_R    = 18;
const WIN_COUNT = 15;
const MAX_BOMBS = 3;

const COINS  = ['₪', '💰', '🪙'];
const BOMBS  = ['💣', '❌', '📉'];

let _id = 0;
function makeItem(score) {
  const isBomb = Math.random() < Math.min(0.28 + score * 0.01, 0.45);
  const lane   = Math.floor(Math.random() * LANES);
  return {
    id: ++_id,
    lane,
    y: -ITEM_R * 2,
    speed: 2.0 + score * 0.12 + Math.random() * 0.8,
    isBomb,
    label: isBomb
      ? BOMBS[Math.floor(Math.random() * BOMBS.length)]
      : COINS[Math.floor(Math.random() * COINS.length)],
  };
}

export default function CatchGame({ onFinish }) {
  const [status, setStatus]   = useState('idle');
  const [score, setScore]     = useState(0);
  const [bombs, setBombs]     = useState(0);
  const [basketLane, setBasketLane] = useState(1);
  const [snap, setSnap]       = useState([]);

  const itemsRef    = useRef([]);
  const caughtIds   = useRef(new Set());
  const basketRef   = useRef(1);
  const scoreRef    = useRef(0);
  const bombRef     = useRef(0);
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
      if (itemsRef.current.length < 4) {
        itemsRef.current = [...itemsRef.current, makeItem(scoreRef.current)];
      }
    }, 750);

    loopRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;

      itemsRef.current = itemsRef.current
        .filter(it => !caughtIds.current.has(it.id))
        .map(it => ({ ...it, y: it.y + it.speed }));

      const basketY = H - BASKET_H - 8;
      const caught = itemsRef.current.filter(it =>
        it.lane === basketRef.current &&
        it.y + ITEM_R >= basketY &&
        it.y - ITEM_R <= basketY + BASKET_H
      );

      caught.forEach(it => {
        caughtIds.current.add(it.id);
        if (it.isBomb) {
          bombRef.current += 1;
          setBombs(bombRef.current);
          if (bombRef.current >= MAX_BOMBS) { die(); return; }
        } else {
          scoreRef.current += 1;
          setScore(scoreRef.current);
          if (scoreRef.current >= WIN_COUNT) { win(); return; }
        }
      });

      itemsRef.current = itemsRef.current.filter(it =>
        !caughtIds.current.has(it.id) && it.y - ITEM_R < H
      );

      setSnap([...itemsRef.current]);
    }, 16);
  }, [die, win]);

  const moveLeft  = () => { const n = Math.max(0, basketRef.current - 1); basketRef.current = n; setBasketLane(n); };
  const moveRight = () => { const n = Math.min(LANES - 1, basketRef.current + 1); basketRef.current = n; setBasketLane(n); };

  const startGame = () => {
    clearInterval(loopRef.current);
    clearInterval(spawnRef.current);
    caughtIds.current.clear();
    itemsRef.current = [];
    scoreRef.current = 0;
    bombRef.current  = 0;
    basketRef.current = 1;
    statusRef.current = 'running';
    setScore(0);
    setBombs(0);
    setBasketLane(1);
    setStatus('running');
    setSnap([]);
    startLoop();
  };

  useEffect(() => () => {
    clearInterval(loopRef.current);
    clearInterval(spawnRef.current);
  }, []);

  const basketX = basketLane * LANE_W + (LANE_W - BASKET_W) / 2;

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>💰 {score} / {WIN_COUNT}</Text>
          <View style={s.bombsRow}>
            {[...Array(MAX_BOMBS)].map((_, i) => (
              <Text key={i} style={{ fontSize: 16, opacity: i < (MAX_BOMBS - bombs) ? 1 : 0.15 }}>💣</Text>
            ))}
          </View>
        </View>
      )}

      <View style={s.game}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#070C14' }]} />

        {/* Lane dividers */}
        {[1, 2].map(i => (
          <View key={i} style={[s.divider, { left: i * LANE_W }]} />
        ))}

        {/* Falling items */}
        {snap.map(it => (
          <Text key={it.id} style={[s.item, {
            left: it.lane * LANE_W + LANE_W / 2 - ITEM_R,
            top:  it.y - ITEM_R,
            color: it.isBomb ? '#E74C3C' : '#D4AF37',
          }]}>
            {it.label}
          </Text>
        ))}

        {/* Basket */}
        {status === 'running' && (
          <View style={[s.basket, { left: basketX, top: H - BASKET_H - 8 }]}>
            <Text style={s.basketLabel}>🧺</Text>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🧺</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'לכוד הזדמנויות' : 'יותר מדי פצצות!'}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `לכוד מטבעות 💰 עם הסל\nהימנע מפצצות 💣\n← → להזזה`
                : `לכדת ${score} מטבעות`}
            </Text>
            <View style={s.overlayBtn}>
              <Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>כל הכבוד!</Text>
            <Text style={s.overlayHint}>לכדת {WIN_COUNT} הזדמנויות!</Text>
            <Text style={s.overlayNote}>ממשיך...</Text>
          </View>
        )}
      </View>

      {status === 'running' && (
        <View style={s.controls}>
          <TouchableOpacity onPress={moveLeft}  style={s.ctrlBtn} activeOpacity={0.7}>
            <Text style={s.ctrlLabel}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={moveRight} style={s.ctrlBtn} activeOpacity={0.7}>
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
  bombsRow: { flexDirection: 'row', gap: 4 },

  game: {
    width: W, height: H,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 2, borderColor: '#1A2030',
    position: 'relative',
  },
  divider: {
    position: 'absolute', top: 0, bottom: 0,
    width: 1, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  item: {
    position: 'absolute',
    fontSize: ITEM_R * 1.6,
    width: ITEM_R * 2, height: ITEM_R * 2,
    textAlign: 'center',
  },
  basket: {
    position: 'absolute',
    width: BASKET_W, height: BASKET_H,
    alignItems: 'center', justifyContent: 'center',
  },
  basketLabel: { fontSize: 26 },

  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12, gap: 12,
  },
  ctrlBtn: {
    flex: 1, height: 52,
    backgroundColor: '#161622',
    borderRadius: 14,
    borderWidth: 1, borderColor: '#2A2A4A',
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
    marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)',
    paddingHorizontal: 28, paddingVertical: 12,
  },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
