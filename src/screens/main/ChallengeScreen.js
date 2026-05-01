import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { canUseFeature } from '../../mock/data';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ObstacleGame from '../../components/ObstacleGame';
import RunnerGame from '../../components/RunnerGame';
import BreakoutGame from '../../components/BreakoutGame';

const GAME_MODES = [
  { key: 'flappy',  label: 'מרוץ המכשולים', emoji: '🐦', desc: 'Flappy Bird + חותמת זמן אישית' },
  { key: 'runner',  label: 'ריצת VerMillion', emoji: '🏃', desc: 'קפוץ מעל חובות וריביות'       },
  { key: 'breakout',label: 'שבור את החובות', emoji: '🧱', desc: 'כדור ומחבט — שבור את הבלוקים' },
];

const DAILY_ATTEMPTS = 3;

function formatTime(h, m, s, ms) {
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
}

export default function ChallengeScreen({ navigation }) {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const isPremium = canUseFeature(profile, 'weekChallenge');

  const [gameMode, setGameMode] = useState(null); // null=picker, 'flappy', 'quiz'
  const [phase, setPhase] = useState('intro');
  const [personalTime, setPersonalTime] = useState(null);
  const [clockDisplay, setClockDisplay] = useState('');
  const [stampResult, setStampResult] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(DAILY_ATTEMPTS);
  const clockRef = useRef(null);
  const personalTimeRef = useRef(null);

  useEffect(() => {
    if (clockRef.current) clearInterval(clockRef.current);
    if (phase === 'stamp') {
      clockRef.current = setInterval(() => {
        const now = new Date();
        setClockDisplay(formatTime(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()));
      }, 10);
    }
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, [phase]);

  const handleGameFinish = () => {
    setAttemptsLeft(prev => Math.max(0, prev - 1));
    setPhase('stamp');
  };

  const handleStamp = () => {
    clearInterval(clockRef.current);
    const now = new Date();
    if (!personalTime) {
      const saved = { hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds(), ms: now.getMilliseconds() };
      personalTimeRef.current = saved;
      setPersonalTime(saved);
      setStampResult({ isFirstTime: true, saved });
    } else {
      const target = new Date();
      target.setHours(personalTime.hour, personalTime.minute, personalTime.second, personalTime.ms);
      const diff = Math.abs(now.getTime() - target.getTime());
      const score = Math.max(0, 100 - diff / 10).toFixed(1);
      setStampResult({ isFirstTime: false, diff, score });
    }
    setPhase('result');
  };

  const reset = () => { setPhase('intro'); setStampResult(null); };
  const ptFormatted = personalTime ? formatTime(personalTime.hour, personalTime.minute, personalTime.second, personalTime.ms) : null;

  // ─── Paywall for free users ───
  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={[styles.paywallWrap, { paddingTop: insets.top + 28 }]}>
          <Text style={styles.paywallLock}>🔒</Text>
          <Text style={styles.paywallTitle}>האתגר היומי</Text>
          <Text style={styles.paywallTitle}>פרמיום בלבד</Text>
          <Text style={styles.paywallSub}>
            {'השתתף בתחרות של 30 יום,\nהתחרה בלוח הדירוג וזכה בפרסים.'}
          </Text>

          <View style={styles.paywallFeatures}>
            {['🎯 אתגר יומי', '🏆 לוח דירוג', '₪45,000 פרס חודשי', '🤖 AI אישי', '📊 ניתוח פרופיל'].map(f => (
              <View key={f} style={styles.paywallFeatureRow}>
                <Text style={styles.paywallFeatureText}>{f}</Text>
                <Text style={styles.paywallCheck}>✓</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.paywallBtn}
            onPress={() => navigation?.navigate('Subscription')}
          >
            <Text style={styles.paywallBtnText}>התחל 7 ימי ניסיון חינם</Text>
          </TouchableOpacity>
          <Text style={styles.paywallPrice}>₪79 לחודש אחרי הניסיון</Text>
        </View>
      </View>
    );
  }

  // ─── Game mode picker ───
  if (gameMode === null) {
    return (
      <View style={styles.container}>
        <View style={[styles.centered, { paddingTop: insets.top + 24 }]}>
          <Text style={styles.pickerTitle}>בחר אתגר להיום</Text>
          <AttemptsRow attemptsLeft={attemptsLeft} total={DAILY_ATTEMPTS} />
          <View style={styles.pickerCards}>
            {GAME_MODES.map(mode => (
              <TouchableOpacity
                key={mode.key}
                style={styles.pickerCard}
                onPress={() => setGameMode(mode.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerEmoji}>{mode.emoji}</Text>
                <Text style={styles.pickerLabel}>{mode.label}</Text>
                <Text style={styles.pickerDesc}>{mode.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ─── Runner mode ───
  if (gameMode === 'runner') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.quizContainer}>
        <View style={[styles.quizHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => setGameMode(null)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← חזור</Text>
          </TouchableOpacity>
          <Text style={styles.quizHeaderTitle}>🏃 ריצת VerMillion</Text>
        </View>
        <RunnerGame onFinish={() => {
          setAttemptsLeft(prev => Math.max(0, prev - 1));
          setPhase('stamp');
          setGameMode('flappy');
        }} />
      </ScrollView>
    );
  }

  // ─── Breakout mode ───
  if (gameMode === 'breakout') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.quizContainer}>
        <View style={[styles.quizHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => setGameMode(null)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← חזור</Text>
          </TouchableOpacity>
          <Text style={styles.quizHeaderTitle}>🧱 שבור את החובות</Text>
        </View>
        <BreakoutGame onFinish={() => {
          setAttemptsLeft(prev => Math.max(0, prev - 1));
          setPhase('stamp');
          setGameMode('flappy');
        }} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>

      {/* INTRO */}
      {phase === 'intro' && (
        <View style={[styles.centered, { paddingTop: insets.top + 24 }]}>
          <Text style={styles.label}>{t.challengeGameType}</Text>

          <AttemptsRow attemptsLeft={attemptsLeft} total={DAILY_ATTEMPTS} />

          {attemptsLeft === 0 ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>סיימת את הניסיונות להיום 🏁</Text>
              <Text style={styles.infoText}>חזור מחר לאתגר הבא. הניסיון הטוב ביותר שלך נשמר.</Text>
            </View>
          ) : !personalTime ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{t.firstTimeTitle}</Text>
              <Text style={styles.infoText}>{t.firstTimeText}</Text>
            </View>
          ) : (
            <View style={styles.ptCard}>
              <Text style={styles.ptLabel}>{t.personalTimeLabel}</Text>
              <Text style={styles.ptValue}>{ptFormatted}</Text>
            </View>
          )}

          {attemptsLeft > 0 && (
            <TouchableOpacity style={styles.mainBtn} onPress={() => setPhase('game')}>
              <Text style={styles.mainBtnText}>{t.startGame}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* GAME */}
      {phase === 'game' && (
        <View style={[styles.gamePage, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.gamePageTitle}>{t.challengeGameType}</Text>
          <ObstacleGame onFinish={handleGameFinish} />
        </View>
      )}

      {/* STAMP */}
      {phase === 'stamp' && (
        <View style={[styles.centered, { paddingTop: insets.top + 24 }]}>
          <Text style={styles.doneLabel}>{t.gameDone}</Text>
          <Text style={styles.stampTitle}>{personalTime ? t.waitForMoment : t.pressNow}</Text>

          {personalTime && (
            <View style={styles.ptCard}>
              <Text style={styles.ptLabel}>{t.personalTimeLabel}</Text>
              <Text style={styles.ptValue}>{ptFormatted}</Text>
            </View>
          )}

          <Text style={styles.clockNow}>{clockDisplay}</Text>
          <Text style={styles.clockLabel}>{t.nowTime}</Text>

          <TouchableOpacity style={styles.stampBtn} onPress={handleStamp}>
            <Text style={styles.stampBtnText}>{personalTime ? t.stampBtn : t.setTimeBtn}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RESULT */}
      {phase === 'result' && stampResult && (
        <View style={[styles.centered, { paddingTop: insets.top + 24 }]}>
          {stampResult.isFirstTime ? (
            <>
              <Text style={styles.resultTitle}>{t.timeSetTitle}</Text>
              <View style={styles.resultCard}>
                <Text style={styles.resultTimeLabel}>{t.yourTime}</Text>
                <Text style={styles.resultTimeBig}>
                  {formatTime(stampResult.saved.hour, stampResult.saved.minute, stampResult.saved.second, stampResult.saved.ms)}
                </Text>
                <Text style={styles.resultNote}>{t.timeSetNote}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>{t.resultLabel}</Text>
              <View style={styles.resultCard}>
                <Text style={styles.resultScore}>{stampResult.score}%</Text>
                <Text style={styles.resultScoreLabel}>{t.accuracyScore}</Text>
                <Text style={styles.resultDiff}>{t.diffMs(stampResult.diff)}</Text>
                <View style={styles.divider} />
                {stampResult.diff < 50   && <Text style={styles.resultEmoji}>🔥</Text>}
                {stampResult.diff >= 50  && stampResult.diff < 200  && <Text style={styles.resultEmoji}>👍</Text>}
                {stampResult.diff >= 200 && stampResult.diff < 1000 && <Text style={styles.resultEmoji}>💪</Text>}
                {stampResult.diff >= 1000 && <Text style={styles.resultEmoji}>📚</Text>}
              </View>

              <AttemptsRow attemptsLeft={attemptsLeft} total={DAILY_ATTEMPTS} />

              {attemptsLeft > 0 ? (
                <TouchableOpacity style={styles.retryBtn} onPress={reset}>
                  <Text style={styles.retryBtnText}>{t.tryAgain} ({attemptsLeft} נותרו)</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.noAttemptsNote}>
                  <Text style={styles.noAttemptsText}>סיימת את כל הניסיונות להיום. חזור מחר!</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

function AttemptsRow({ attemptsLeft, total }) {
  return (
    <View style={styles.attemptsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.attemptDot, i < attemptsLeft ? styles.attemptDotActive : styles.attemptDotUsed]}
        />
      ))}
      <Text style={styles.attemptsLabel}>{attemptsLeft} ניסיונות נותרו</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  gamePage: { flex: 1, paddingHorizontal: 24 },
  gamePageTitle: { color: '#888', fontSize: 13, letterSpacing: 2, marginBottom: 16, textAlign: 'center' },
  label: { color: '#888', fontSize: 13, letterSpacing: 2, marginBottom: 16 },

  // Attempts
  attemptsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  attemptDot: { width: 12, height: 12, borderRadius: 6 },
  attemptDotActive: { backgroundColor: '#C0392B' },
  attemptDotUsed: { backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#333' },
  attemptsLabel: { color: '#555', fontSize: 12, marginLeft: 4 },

  // Cards
  infoCard: { backgroundColor: '#111', borderRadius: 20, padding: 24, width: '100%', marginBottom: 32, borderWidth: 1, borderColor: '#1E1E1E' },
  infoTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'right' },
  infoText: { color: '#888', fontSize: 15, lineHeight: 24, textAlign: 'right' },
  ptCard: { backgroundColor: '#1A0E0E', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: '#3A1A1A' },
  ptLabel: { color: '#C0392B', fontSize: 12, marginBottom: 8 },
  ptValue: { color: '#FFF', fontSize: 34, fontWeight: '900', fontVariant: ['tabular-nums'] },

  // Buttons
  mainBtn: { backgroundColor: '#C0392B', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 48 },
  mainBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  stampBtn: { backgroundColor: '#C0392B', borderRadius: 14, paddingVertical: 20, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  stampBtnText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  retryBtn: { borderWidth: 1, borderColor: '#1E1E1E', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 },
  retryBtnText: { color: '#888', fontSize: 16 },
  noAttemptsNote: { backgroundColor: '#1A1A1A', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  noAttemptsText: { color: '#555', fontSize: 14, textAlign: 'center' },

  // Stamp phase
  doneLabel: { color: '#4CAF50', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  stampTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 32, textAlign: 'center' },
  clockNow: { color: '#FFF', fontSize: 46, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: 1, marginBottom: 4 },
  clockLabel: { color: '#444', fontSize: 12, marginBottom: 40 },

  // Result
  resultTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 24, textAlign: 'center' },
  resultCard: { backgroundColor: '#111', borderRadius: 24, padding: 32, width: '100%', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1E1E1E' },
  resultTimeLabel: { color: '#888', fontSize: 13, marginBottom: 8 },
  resultTimeBig: { color: '#C0392B', fontSize: 36, fontWeight: '900', fontVariant: ['tabular-nums'] },
  resultNote: { color: '#555', fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 16 },
  resultScore: { color: '#F0C040', fontSize: 72, fontWeight: '900' },
  resultScoreLabel: { color: '#888', fontSize: 14 },
  resultDiff: { color: '#555', fontSize: 14, marginTop: 8 },
  divider: { width: '60%', height: 1, backgroundColor: '#1E1E1E', marginVertical: 20 },
  resultEmoji: { fontSize: 32 },

  // Game mode picker
  pickerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  pickerCards: { width: '100%', gap: 14 },
  pickerCard: { backgroundColor: '#111', borderRadius: 18, padding: 22, borderWidth: 1, borderColor: '#1E1E1E', alignItems: 'center', gap: 8 },
  pickerEmoji: { fontSize: 40 },
  pickerLabel: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  pickerDesc: { color: '#555', fontSize: 13 },

  // Quiz
  quizContainer: { padding: 20, paddingBottom: 40 },
  quizHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  quizHeaderTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  backBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  backBtnText: { color: '#666', fontSize: 14 },

  // Paywall
  paywallWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  paywallLock: { fontSize: 48, marginBottom: 16 },
  paywallTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  paywallSub: { color: '#666', fontSize: 15, textAlign: 'center', lineHeight: 24, marginTop: 12, marginBottom: 28 },
  paywallFeatures: { width: '100%', backgroundColor: '#111', borderRadius: 16, padding: 20, marginBottom: 28, gap: 12, borderWidth: 1, borderColor: '#1E1E1E' },
  paywallFeatureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paywallFeatureText: { color: '#CCC', fontSize: 15 },
  paywallCheck: { color: '#C0392B', fontSize: 16, fontWeight: '700' },
  paywallBtn: { backgroundColor: '#C0392B', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 40, width: '100%', alignItems: 'center', marginBottom: 12 },
  paywallBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  paywallPrice: { color: '#444', fontSize: 13 },
});
