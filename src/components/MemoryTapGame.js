import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W          = SW - 48;
const H          = 340;
const WIN_ROUNDS = 7;
const FLASH_MS   = 500;
const GAP_MS     = 200;

const CELL_COLORS = ['#C0392B','#E67E22','#D4AF37','#2ECC71','#3498DB','#9B59B6'];
const ICONS = ['₪','💰','🏦','📈','💎','🪙'];

export default function MemoryTapGame({ onFinish }) {
  const [status, setStatus]       = useState('idle'); // idle|showing|input|dead|done
  const [round, setRound]         = useState(0);
  const [flashCell, setFlashCell] = useState(null);
  const [inputIdx, setInputIdx]   = useState(0);
  const [mistakes, setMistakes]   = useState(0);
  const [snap, setSnap]           = useState({ active: null, correct: null, wrong: null });

  const seqRef     = useRef([]);
  const inputRef   = useRef(0);
  const roundRef   = useRef(0);
  const mistakesRef = useRef(0);
  const statusRef  = useRef('idle');
  const timerRef   = useRef(null);

  const die = useCallback(() => {
    clearTimeout(timerRef.current);
    statusRef.current = 'dead';
    setStatus('dead');
  }, []);

  const win = useCallback(() => {
    clearTimeout(timerRef.current);
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(roundRef.current), 800);
  }, [onFinish]);

  const showSequence = useCallback((seq) => {
    statusRef.current = 'showing';
    setStatus('showing');
    setFlashCell(null);
    let i = 0;
    const next = () => {
      if (i >= seq.length) {
        timerRef.current = setTimeout(() => {
          statusRef.current = 'input';
          setStatus('input');
          inputRef.current = 0;
          setInputIdx(0);
        }, GAP_MS + 200);
        return;
      }
      timerRef.current = setTimeout(() => {
        setFlashCell(seq[i]);
        timerRef.current = setTimeout(() => {
          setFlashCell(null);
          i++;
          timerRef.current = setTimeout(next, GAP_MS);
        }, FLASH_MS);
      }, GAP_MS);
    };
    timerRef.current = setTimeout(next, 400);
  }, []);

  const nextRound = useCallback((currentSeq) => {
    const newSeq = [...currentSeq, Math.floor(Math.random() * 9)];
    seqRef.current = newSeq;
    roundRef.current += 1;
    setRound(roundRef.current);
    showSequence(newSeq);
  }, [showSequence]);

  const tapCell = useCallback((cell) => {
    if (statusRef.current !== 'input') return;
    const expected = seqRef.current[inputRef.current];

    if (cell === expected) {
      setSnap({ active: null, correct: cell, wrong: null });
      setTimeout(() => setSnap({ active: null, correct: null, wrong: null }), 250);
      inputRef.current += 1;
      setInputIdx(inputRef.current);

      if (inputRef.current >= seqRef.current.length) {
        if (roundRef.current >= WIN_ROUNDS) { win(); return; }
        timerRef.current = setTimeout(() => nextRound(seqRef.current), 600);
      }
    } else {
      setSnap({ active: null, correct: null, wrong: cell });
      setTimeout(() => setSnap({ active: null, correct: null, wrong: null }), 350);
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
      if (mistakesRef.current >= 3) { die(); return; }
      // Show sequence again
      timerRef.current = setTimeout(() => {
        inputRef.current = 0;
        setInputIdx(0);
        showSequence(seqRef.current);
      }, 600);
    }
  }, [win, die, nextRound, showSequence]);

  const startGame = () => {
    clearTimeout(timerRef.current);
    seqRef.current = [];
    inputRef.current = 0;
    roundRef.current = 0;
    mistakesRef.current = 0;
    statusRef.current = 'showing';
    setRound(0);
    setInputIdx(0);
    setMistakes(0);
    setFlashCell(null);
    setSnap({ active: null, correct: null, wrong: null });
    setStatus('showing');
    nextRound([]);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const CELL_W = Math.floor((W - 32 - 16) / 3);
  const CELL_H = Math.floor((H - 40 - 16) / 3);
  const isShowing = status === 'showing';
  const isInput   = status === 'input';

  return (
    <View style={s.wrapper}>
      {(status === 'showing' || status === 'input') && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>🧠 שלב {round} / {WIN_ROUNDS}</Text>
          <View style={s.right}>
            <Text style={s.phase}>{isShowing ? '👀 שנן...' : `📝 ${inputRef.current}/${seqRef.current.length}`}</Text>
            <View style={s.livesRow}>
              {[...Array(3)].map((_, i) => (
                <Text key={i} style={{ fontSize: 14, opacity: i < (3 - mistakes) ? 1 : 0.15 }}>❤️</Text>
              ))}
            </View>
          </View>
        </View>
      )}

      <View style={s.game}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#06080F' }]} />

        <View style={s.grid}>
          {[0, 1, 2].map(row => (
            <View key={row} style={s.gridRow}>
              {[0, 1, 2].map(col => {
                const idx      = row * 3 + col;
                const isFlash  = flashCell === idx;
                const isCorrect = snap.correct === idx;
                const isWrong   = snap.wrong   === idx;
                const color     = CELL_COLORS[idx % CELL_COLORS.length];
                return (
                  <TouchableOpacity
                    key={col}
                    onPress={() => isInput && tapCell(idx)}
                    activeOpacity={isInput ? 0.6 : 1}
                    style={[
                      s.cell,
                      { width: CELL_W, height: CELL_H },
                      isFlash   && { backgroundColor: color + 'CC', borderColor: color, shadowColor: color },
                      isCorrect && { backgroundColor: '#2ECC7133', borderColor: '#2ECC71' },
                      isWrong   && { backgroundColor: '#E74C3C33', borderColor: '#E74C3C' },
                    ]}
                  >
                    {(isFlash || isCorrect) && (
                      <Text style={s.cellIcon}>{ICONS[idx % ICONS.length]}</Text>
                    )}
                    {isWrong && <Text style={s.cellIcon}>❌</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🧠</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'זיכרון פיננסי' : `טעית יותר מדי!`}</Text>
            <Text style={s.overlayHint}>
              {status === 'idle'
                ? `שנן את הרצף המהבהב\nחזור עליו בסדר הנכון\n${WIN_ROUNDS} שלבים לניצחון`
                : `הגעת לשלב ${round}`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'נסה שוב'}</Text></View>
          </TouchableOpacity>
        )}

        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>זיכרון מושלם!</Text>
            <Text style={s.overlayHint}>{WIN_ROUNDS} שלבים ללא שגיאה!</Text>
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
  scoreText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phase: { color: '#D4AF37', fontSize: 13, fontWeight: '700' },
  livesRow: { flexDirection: 'row', gap: 3 },

  game: {
    width: W, height: H,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 2, borderColor: '#1A1A3A',
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },
  grid: { padding: 16, gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8 },
  cell: {
    borderRadius: 14,
    backgroundColor: '#0C0E1A',
    borderWidth: 1, borderColor: '#2A2A4A',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 12, elevation: 8,
  },
  cellIcon: { fontSize: 24 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,15,0.90)',
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
