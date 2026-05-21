import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const PAIRS = ['💰', '💳', '📈', '🏦', '🪙', '🏠'];
const COLS = 4;
const ROWS = 3;
const GAME_BORDER = 2;
const GRID_PAD = 12;
const CARD_GAP = 8;
const cardW = Math.floor((W - GAME_BORDER * 2 - GRID_PAD * 2 - (COLS - 1) * CARD_GAP) / COLS);
const cardH = Math.round(cardW * 1.15);
const H = ROWS * cardH + (ROWS - 1) * CARD_GAP + GRID_PAD * 2 + GAME_BORDER * 2;

function makeCards() {
  return [...PAIRS, ...PAIRS]
    .map((icon, i) => ({ id: i, icon, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
}

export default function CardFlipGame({ onFinish }) {
  const [status,   setStatus]   = useState('idle');
  const [cards,    setCards]    = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [matched,  setMatched]  = useState(0);
  const [flash,    setFlash]    = useState(null);

  const cardsRef    = useRef([]);
  const lockedRef   = useRef(false);
  const mistakesRef = useRef(0);
  const matchedRef  = useRef(0);
  const statusRef   = useRef('idle');
  const timerRef    = useRef(null);

  function setCardsSync(next) {
    cardsRef.current = next;
    setCards(next);
  }

  const win = useCallback(() => {
    statusRef.current = 'done';
    setStatus('done');
    setTimeout(() => onFinish(Math.max(10, 60 - mistakesRef.current * 4)), 800);
  }, [onFinish]);

  const tapCard = useCallback((id) => {
    if (lockedRef.current || statusRef.current !== 'running') return;
    const prev = cardsRef.current;
    const card = prev.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const updated = prev.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCardsSync(updated);

    const flipped = updated.filter(c => c.flipped && !c.matched);
    if (flipped.length < 2) return;

    lockedRef.current = true;
    const [a, b] = flipped;

    if (a.icon === b.icon) {
      matchedRef.current += 1;
      setMatched(matchedRef.current);
      setFlash('hit');
      const withMatch = updated.map(c => c.flipped ? { ...c, matched: true } : c);
      setCardsSync(withMatch);
      timerRef.current = setTimeout(() => {
        setFlash(null);
        lockedRef.current = false;
        if (matchedRef.current >= PAIRS.length) win();
      }, 400);
    } else {
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
      setFlash('miss');
      timerRef.current = setTimeout(() => {
        setFlash(null);
        setCardsSync(cardsRef.current.map(c => !c.matched ? { ...c, flipped: false } : c));
        lockedRef.current = false;
      }, 700);
    }
  }, [win]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const startGame = () => {
    clearTimeout(timerRef.current);
    lockedRef.current   = false;
    mistakesRef.current = 0;
    matchedRef.current  = 0;
    statusRef.current   = 'running';
    const fresh = makeCards();
    cardsRef.current = fresh;
    setCards(fresh);
    setMistakes(0); setMatched(0); setFlash(null);
    setStatus('running');
  };

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>🃏 {matched} / {PAIRS.length} זוגות</Text>
          <Text style={s.mistakeText}>טעויות: {mistakes}</Text>
        </View>
      )}

      <View style={[s.game, flash === 'hit' && s.gameHit, flash === 'miss' && s.gameMiss]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060A10' }]} />

        {status === 'running' && (
          <View style={s.grid}>
            {cards.map(card => (
              <TouchableOpacity
                key={card.id}
                onPress={() => tapCard(card.id)}
                activeOpacity={0.8}
                style={[
                  s.card,
                  { width: cardW, height: cardH },
                  card.flipped  && s.cardFlipped,
                  card.matched  && s.cardMatched,
                ]}
              >
                <Text style={s.cardIcon}>
                  {card.flipped || card.matched ? card.icon : '❓'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>🃏</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'זיכרון זוגות' : 'נסה שוב!'}</Text>
            <Text style={s.overlayHint}>
              {`מצא ${PAIRS.length} זוגות פיננסיים\nהפוך 2 קלפים — התאם ביניהם`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'שחק שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>כל הזוגות!</Text>
            <Text style={s.overlayHint}>מצאת את כל ה-{PAIRS.length} זוגות!</Text>
            <Text style={s.overlayNote}>ממשיך...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:     { width: W, alignSelf: 'center' },
  scoreRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreText:   { color: '#FFF', fontSize: 15, fontWeight: '800' },
  mistakeText: { color: '#E74C3C', fontSize: 14, fontWeight: '700' },
  game:        { width: W, height: H, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: '#1A1A2A', position: 'relative' },
  gameHit:     { borderColor: '#2ECC71' },
  gameMiss:    { borderColor: '#E74C3C' },
  grid:        { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8, alignContent: 'center' },
  card:        { borderRadius: 10, backgroundColor: '#111830', borderWidth: 1, borderColor: '#2A2A4A', alignItems: 'center', justifyContent: 'center' },
  cardFlipped: { backgroundColor: '#1A2A4A', borderColor: '#3498DB' },
  cardMatched: { backgroundColor: '#0A1A0A', borderColor: '#2ECC71' },
  cardIcon:    { fontSize: Math.round(cardW * 0.38) },
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
