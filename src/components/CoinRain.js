import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CATCHER_Y = 240;
const CATCHER_HALF = 12;
const TICK_MS = 60;

export default function CoinRain({ onFinish }) {
  const itemsRef = useRef([]);
  const catcherRef = useRef(50);
  const scoreRef = useRef(0);
  const timeRef = useRef(30);
  const nextIdRef = useRef(0);
  const tickCountRef = useRef(0);
  const intervalRef = useRef(null);

  const [tick, setTick] = useState(0);
  const [done, setDone] = useState(false);

  const spawnItem = useCallback(() => {
    const isBomb = Math.random() < 0.3;
    itemsRef.current.push({
      id: nextIdRef.current++,
      x: 5 + Math.random() * 90,
      y: 0,
      speed: 4 + (Math.random() - 0.5) * 1.5,
      type: isBomb ? 'bomb' : 'coin',
    });
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tickCountRef.current += 1;

      if (tickCountRef.current % 17 === 0) {
        timeRef.current -= 1;
        if (timeRef.current <= 0) {
          clearInterval(intervalRef.current);
          setDone(true);
          return;
        }
      }

      if (tickCountRef.current % 4 === 0) {
        spawnItem();
      }

      const catcher = catcherRef.current;
      const surviving = [];

      for (const item of itemsRef.current) {
        item.y += item.speed;

        if (item.y > CATCHER_Y && item.y < CATCHER_Y + 30) {
          const diff = Math.abs(item.x - catcher);
          if (diff <= CATCHER_HALF) {
            if (item.type === 'coin') {
              scoreRef.current += 1;
            } else {
              scoreRef.current = Math.max(0, scoreRef.current - 1);
            }
            continue;
          }
        }

        if (item.y < 310) {
          surviving.push(item);
        }
      }

      itemsRef.current = surviving;
      setTick(t => t + 1);
    }, TICK_MS);

    return () => clearInterval(intervalRef.current);
  }, [spawnItem]);

  const moveLeft = useCallback(() => {
    catcherRef.current = Math.max(CATCHER_HALF, catcherRef.current - 8);
    setTick(t => t + 1);
  }, []);

  const moveRight = useCallback(() => {
    catcherRef.current = Math.min(100 - CATCHER_HALF, catcherRef.current + 8);
    setTick(t => t + 1);
  }, []);

  const score = scoreRef.current;
  const timeLeft = timeRef.current;
  const catcherX = catcherRef.current;

  if (done) {
    let label = 'טוב!';
    if (score >= 10) label = 'אלוף!';
    else if (score >= 5) label = 'מצוין!';

    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneLabel}>{label}</Text>
        <Text style={styles.doneScore}>{score}</Text>
        <Text style={styles.doneSubtext}>מטבעות נתפסו</Text>
        <TouchableOpacity style={styles.finishBtn} onPress={() => onFinish(score)}>
          <Text style={styles.finishBtnText}>← סיים וחתום זמן</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catcherPixelX = (catcherX / 100) * SCREEN_WIDTH - 40;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.timerText}>⏱ {timeLeft}s</Text>
        <Text style={styles.scoreText}>🪙 {score}</Text>
      </View>

      <View style={styles.playArea}>
        {itemsRef.current.map(item => (
          <Text
            key={item.id}
            style={[styles.item, { left: `${item.x}%`, top: item.y }]}
          >
            {item.type === 'coin' ? '🪙' : '💥'}
          </Text>
        ))}

        <View style={[styles.catcher, { left: catcherPixelX, top: CATCHER_Y + 10 }]} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={moveRight}>
          <Text style={styles.btnText}>{'>'}</Text>
        </TouchableOpacity>
        <Text style={styles.controlHint}>הזז את הסל</Text>
        <TouchableOpacity style={styles.btn} onPress={moveLeft}>
          <Text style={styles.btnText}>{'<'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  timerText: {
    color: '#C0392B',
    fontSize: 16,
    fontWeight: '700',
  },
  scoreText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
  },
  playArea: {
    position: 'relative',
    height: 280,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  item: {
    position: 'absolute',
    fontSize: 22,
  },
  catcher: {
    position: 'absolute',
    width: 80,
    height: 14,
    backgroundColor: '#C0392B',
    borderRadius: 7,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
  },
  btn: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#C0392B',
    borderRadius: 12,
    width: 56,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  controlHint: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
  },
  doneContainer: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  doneLabel: {
    color: '#D4AF37',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  doneScore: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 80,
  },
  doneSubtext: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  finishBtn: {
    backgroundColor: '#C0392B',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
