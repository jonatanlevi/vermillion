import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');
const W = SW - 48;
const H = 340;
const TICKS     = 30;
const WIN_SCORE = 500;
const TICK_MS   = 600;

const STOCKS = ['VRML', 'FINX', 'TECH', 'BANK'];

function genTick(prev) {
  const delta = (Math.random() - 0.48) * 0.08;
  return Math.max(10, +(prev * (1 + delta)).toFixed(2));
}

export default function StockTickerGame({ onFinish }) {
  const [status,  setStatus]  = useState('idle');
  const [price,   setPrice]   = useState(100);
  const [held,    setHeld]    = useState(false);
  const [boughtAt,setBoughtAt]= useState(null);
  const [cash,    setCash]    = useState(1000);
  const [tick,    setTick]    = useState(0);
  const [flash,   setFlash]   = useState(null);
  const [stock]   = useState(STOCKS[Math.floor(Math.random() * STOCKS.length)]);

  const priceRef   = useRef(100);
  const heldRef    = useRef(false);
  const boughtRef  = useRef(null);
  const cashRef    = useRef(1000);
  const tickRef    = useRef(0);
  const statusRef  = useRef('idle');
  const intervalRef = useRef(null);
  const doSellRef  = useRef(null);

  const win = useCallback(() => {
    clearInterval(intervalRef.current);
    statusRef.current = 'done';
    setStatus('done');
    const finalScore = Math.max(0, Math.round(cashRef.current - 1000));
    setTimeout(() => onFinish(Math.min(200, Math.max(0, finalScore / 5))), 800);
  }, [onFinish]);

  const sell = useCallback(() => {
    if (!heldRef.current) return;
    const profit = +(priceRef.current - boughtRef.current).toFixed(2);
    cashRef.current = +(cashRef.current + priceRef.current).toFixed(2);
    heldRef.current = false;
    boughtRef.current = null;
    setCash(cashRef.current);
    setHeld(false);
    setBoughtAt(null);
    setFlash(profit >= 0 ? 'hit' : 'miss');
    setTimeout(() => setFlash(null), 500);
  }, []);

  doSellRef.current = sell;

  const buy = useCallback(() => {
    if (heldRef.current) return;
    if (cashRef.current < priceRef.current) return;
    cashRef.current   = +(cashRef.current - priceRef.current).toFixed(2);
    heldRef.current   = true;
    boughtRef.current = priceRef.current;
    setCash(cashRef.current);
    setHeld(true);
    setBoughtAt(priceRef.current);
  }, []);

  const startGame = () => {
    clearInterval(intervalRef.current);
    priceRef.current  = 100;
    heldRef.current   = false;
    boughtRef.current = null;
    cashRef.current   = 1000;
    tickRef.current   = 0;
    statusRef.current = 'running';
    setPrice(100); setHeld(false); setBoughtAt(null);
    setCash(1000); setTick(0); setFlash(null);
    setStatus('running');

    intervalRef.current = setInterval(() => {
      if (statusRef.current !== 'running') return;
      priceRef.current = genTick(priceRef.current);
      tickRef.current += 1;
      setPrice(priceRef.current);
      setTick(tickRef.current);

      if (tickRef.current >= TICKS) {
        if (heldRef.current) doSellRef.current();
        win();
      }
    }, TICK_MS);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const pnl = held && boughtAt ? +(price - boughtAt).toFixed(2) : null;
  const pnlColor = pnl === null ? '#888' : pnl >= 0 ? '#2ECC71' : '#E74C3C';
  const totalProfit = +(cash - 1000 + (held ? price : 0)).toFixed(0);
  const borderColor = flash === 'hit' ? '#2ECC71' : flash === 'miss' ? '#E74C3C' : '#1A1A2A';

  return (
    <View style={s.wrapper}>
      {status === 'running' && (
        <View style={s.scoreRow}>
          <Text style={s.scoreText}>📈 {stock}</Text>
          <Text style={s.pts}>₪{Math.round(cash)} מזומן</Text>
        </View>
      )}

      <View style={[s.game, { borderColor }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#060A10' }]} />

        {status === 'running' && (
          <View style={s.inner}>
            <View style={s.header}>
              <Text style={s.priceLabel}>מחיר</Text>
              <Text style={s.priceNum}>₪{price.toFixed(2)}</Text>
              {pnl !== null && (
                <Text style={[s.pnlText, { color: pnlColor }]}>
                  {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                </Text>
              )}
            </View>

            <View style={s.progressRow}>
              <View style={s.progressTrack}>
                <View style={[s.progressBar, { width: `${(tick / TICKS) * 100}%` }]} />
              </View>
              <Text style={s.tickText}>{TICKS - tick} טיקים</Text>
            </View>

            <View style={s.profitRow}>
              <Text style={[s.totalProfit, { color: totalProfit >= 0 ? '#2ECC71' : '#E74C3C' }]}>
                רווח: {totalProfit >= 0 ? '+' : ''}₪{totalProfit}
              </Text>
            </View>

            <View style={s.btnRow}>
              <TouchableOpacity
                onPress={buy}
                disabled={held || cash < price}
                style={[s.actionBtn, s.buyBtn, (held || cash < price) && s.btnDisabled]}
                activeOpacity={0.7}
              >
                <Text style={s.btnText}>🟢 קנה</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={sell}
                disabled={!held}
                style={[s.actionBtn, s.sellBtn, !held && s.btnDisabled]}
                activeOpacity={0.7}
              >
                <Text style={s.btnText}>🔴 מכור</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(status === 'idle' || status === 'dead') && (
          <TouchableOpacity onPress={startGame} style={s.overlay} activeOpacity={1}>
            <Text style={s.overlayEmoji}>📈</Text>
            <Text style={s.overlayTitle}>{status === 'idle' ? 'מסחר מהיר' : 'נסה שוב!'}</Text>
            <Text style={s.overlayHint}>
              {`קנה ומכור מניה\n₪1000 הון התחלתי\n${TICKS} טיקים — הרוויח כמה שתוכל`}
            </Text>
            <View style={s.overlayBtn}><Text style={s.overlayBtnText}>{status === 'idle' ? 'לחץ להתחיל' : 'שחק שוב'}</Text></View>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <View style={s.overlay}>
            <Text style={s.overlayEmoji}>🏆</Text>
            <Text style={s.overlayTitle}>סיום!</Text>
            <Text style={s.overlayHint}>סיימת עם ₪{Math.round(cashRef.current)}</Text>
            <Text style={s.overlayNote}>ממשיך...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:   { width: W, alignSelf: 'center' },
  scoreRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scoreText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  pts:       { color: '#D4AF37', fontSize: 14, fontWeight: '700' },
  game:      { width: W, height: H, borderRadius: 18, overflow: 'hidden', borderWidth: 2, position: 'relative' },
  inner:     { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 20 },
  header:    { alignItems: 'center', gap: 4 },
  priceLabel:{ color: '#666', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  priceNum:  { color: '#FFF', fontSize: 42, fontWeight: '900' },
  pnlText:   { fontSize: 16, fontWeight: '800' },
  progressRow:{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#1A1A2A', borderRadius: 3, overflow: 'hidden' },
  progressBar:   { height: '100%', backgroundColor: '#D4AF37', borderRadius: 3 },
  tickText:  { color: '#888', fontSize: 12, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  profitRow: { alignItems: 'center' },
  totalProfit: { fontSize: 18, fontWeight: '900' },
  btnRow:    { flexDirection: 'row', gap: 20, width: '100%' },
  actionBtn: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 2 },
  buyBtn:    { backgroundColor: 'rgba(46,204,113,0.15)', borderColor: '#2ECC71' },
  sellBtn:   { backgroundColor: 'rgba(231,76,60,0.15)', borderColor: '#E74C3C' },
  btnDisabled: { opacity: 0.3 },
  btnText:   { color: '#FFF', fontSize: 16, fontWeight: '900' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,15,0.88)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  overlayEmoji: { fontSize: 48 },
  overlayTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  overlayHint:  { color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  overlayNote:  { color: '#D4AF37', fontSize: 14, marginTop: 4 },
  overlayBtn:   { marginTop: 8, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)', paddingHorizontal: 28, paddingVertical: 12 },
  overlayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
