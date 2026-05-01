import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { DAY_QUESTIONS, DAY_META, calcCompletion, detectCashFlowAlert } from '../../data/dailyQuestions';
import { useLanguage } from '../../context/LanguageContext';
import { getUserTimeStatus } from '../../services/timeEngine';
import { getOnboardingState, markDayComplete, saveOnboardingState } from '../../services/storage';

/* ─── Skip warning dialog ─── */
function SkipDialog({ visible, blindSpot, onSkip, onStay, t }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={d.backdrop}>
        <View style={d.sheet}>
          <Text style={d.icon}>⚠️</Text>
          <Text style={d.title}>{t.dqSkipTitle}</Text>
          <Text style={d.body}>{t.dqSkipBody(blindSpot)}</Text>
          <View style={d.row}>
            <TouchableOpacity style={d.btnSkip} onPress={onSkip}>
              <Text style={d.btnSkipText}>{t.dqSkipConfirm}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={d.btnStay} onPress={onStay}>
              <Text style={d.btnStayText}>{t.dqSkipCancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Document upload mock ─── */
function DocumentUpload({ question, onUpload, onSkip, uploaded, dayColor, t }) {
  const [uploading, setUploading] = useState(false);
  const mockUpload = (label) => {
    setUploading(true);
    setTimeout(() => { setUploading(false); onUpload({ name: label, size: '2.4 MB', type: 'pdf' }); }, 1400);
  };
  return (
    <View style={doc.wrap}>
      {uploaded ? (
        <View style={[doc.successBox, { borderColor: dayColor + '88' }]}>
          <Text style={doc.successIcon}>✓</Text>
          <View style={doc.successInfo}>
            <Text style={[doc.successName, { color: dayColor }]}>{uploaded.name}</Text>
            <Text style={doc.successSize}>{uploaded.size} · PDF</Text>
          </View>
          <TouchableOpacity onPress={() => onUpload(null)}><Text style={doc.successRemove}>✕</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={[doc.dropzone, { borderColor: dayColor + '55' }]}>
          {uploading ? (
            <View style={doc.uploading}><Text style={[doc.uploadingText, { color: dayColor }]}>{t.dqUploading}</Text></View>
          ) : (
            <>
              <Text style={doc.dropIcon}>📎</Text>
              <Text style={doc.dropTitle}>{t.dqDocChoose}</Text>
              <Text style={doc.dropSub}>{t.dqDocSub}</Text>
              <View style={doc.btnRow}>
                {question.docLabels?.map((label, i) => (
                  <TouchableOpacity key={i} style={[doc.typeBtn, { borderColor: dayColor + '66' }]} onPress={() => mockUpload(label)}>
                    <Text style={[doc.typeBtnText, { color: dayColor }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}
      {question.hint && (
        <View style={doc.hintBox}><Text style={doc.hintIcon}>🤖</Text><Text style={doc.hintText}>{question.hint}</Text></View>
      )}
      <TouchableOpacity style={doc.skipDoc} onPress={onSkip}><Text style={doc.skipDocText}>{t.dqShareLater}</Text></TouchableOpacity>
    </View>
  );
}

/* ─── Choice question ─── */
function ChoiceQuestion({ question, value, onSelect, dayColor }) {
  return (
    <View style={ch.wrap}>
      {question.options.map((opt) => {
        const sel = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[ch.option, sel && { borderColor: dayColor, backgroundColor: dayColor + '15' }]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            <View style={ch.optionInner}>
              <View style={[ch.radio, sel && { borderColor: dayColor }]}>
                {sel && <View style={[ch.radioFill, { backgroundColor: dayColor }]} />}
              </View>
              <View style={ch.optionText}>
                <Text style={[ch.optionLabel, sel && { color: '#FFF' }]}>{opt.label}</Text>
                {opt.sub ? <Text style={ch.optionSub}>{opt.sub}</Text> : null}
              </View>
              {sel && <Text style={[ch.check, { color: dayColor }]}>✓</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ─── Number question ─── */
function NumberQuestion({ question, value, onChange, dayColor }) {
  const hasValue = value && value !== '';
  return (
    <View style={nm.wrap}>
      <View style={[nm.inputWrap, hasValue && { borderColor: dayColor }]}>
        {question.prefix ? <Text style={[nm.prefix, { color: hasValue ? dayColor : '#444' }]}>{question.prefix}</Text> : null}
        <TextInput
          style={nm.input}
          value={value}
          onChangeText={v => onChange(v.replace(/[^0-9]/g, ''))}
          placeholder={question.placeholder || '0'}
          placeholderTextColor="#333"
          keyboardType="numeric"
          textAlign="right"
          returnKeyType="done"
        />
        {question.suffix ? <Text style={nm.suffix}>{question.suffix}</Text> : null}
      </View>
      {question.hint ? <Text style={nm.hint}>{question.hint}</Text> : null}
    </View>
  );
}

/* ─── Open question ─── */
function OpenQuestion({ question, value, onChange }) {
  return (
    <TextInput
      style={op.input}
      value={value}
      onChangeText={onChange}
      placeholder={question.placeholder}
      placeholderTextColor="#333"
      multiline
      textAlign="right"
      textAlignVertical="top"
      returnKeyType="done"
    />
  );
}

/* ─── Life event acknowledgment ─── */
// Only shown when life_event_recency is 'recent' or 'mid' — not for long_ago
function LifeEventAck({ familyStatus, recency, dayColor, onContinue }) {
  const isWidowed = familyStatus === 'widowed';
  const isRecent  = recency === 'recent';

  const title = isWidowed ? 'VerMillion רואה אותך' : 'VerMillion מכיר את המציאות שלך';
  const body  = isWidowed
    ? isRecent
      ? 'אנחנו יודעים שזה זמן קשה. VerMillion יתחשב בנסיבות שלך לאורך כל הדרך — בלי הנחות גנריות.'
      : 'המצב שלך דורש גישה שונה. VerMillion יבנה תוכנית שמותאמת לאיפה שאת/ה היום.'
    : isRecent
      ? 'גירושין טריים משנים הכל — הכנסות, הוצאות, חובות. VerMillion יתחשב בזה בכל המלצה.'
      : 'גירושין מחדשים את כל המשוואה. VerMillion יבנה תוכנית למציאות שלך היום — לא לזו שהייתה.';

  return (
    <View style={ack.wrap}>
      <Text style={ack.icon}>{isWidowed ? '🕊️' : '🤝'}</Text>
      <Text style={ack.title}>{title}</Text>
      <Text style={ack.body}>{body}</Text>
      <TouchableOpacity style={[ack.btn, { backgroundColor: dayColor }]} onPress={onContinue} activeOpacity={0.85}>
        <Text style={ack.btnText}>המשך →</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Income check — before cash flow alert ─── */
// Catches underreported income (e.g. נועה forgot parents' ₪1,800)
const INCOME_SOURCES = [
  { key: 'parents',    label: 'תמיכת הורים',          icon: '👨‍👩‍👧' },
  { key: 'grant',      label: 'מלגה / מענק',           icon: '🎓' },
  { key: 'allowance',  label: 'דמי אבטלה / השלמת הכנסה', icon: '🏛️' },
  { key: 'gig',        label: 'עבודות זמניות / מזומן', icon: '💵' },
  { key: 'other',      label: 'אחר',                   icon: '➕' },
];

function IncomeCheck({ deficit, onConfirm, onSkip }) {
  const [checked, setChecked]   = useState({});
  const [extraIncome, setExtra] = useState('');

  const anyChecked = Object.values(checked).some(Boolean);

  const toggle = (key) => setChecked(c => ({ ...c, [key]: !c[key] }));

  return (
    <View style={ic.wrap}>
      <View style={ic.card}>
        <Text style={ic.icon}>🔍</Text>
        <Text style={ic.title}>רגע לפני —</Text>
        <Text style={ic.subtitle}>VerMillion זיהה גירעון. האם יש הכנסות שלא הכנסת?</Text>
        <Text style={ic.examples}>לפעמים שוכחים:</Text>

        <View style={ic.sources}>
          {INCOME_SOURCES.map(src => {
            const sel = !!checked[src.key];
            return (
              <TouchableOpacity
                key={src.key}
                style={[ic.sourceRow, sel && ic.sourceRowSel]}
                onPress={() => toggle(src.key)}
                activeOpacity={0.8}
              >
                <Text style={ic.sourceIcon}>{src.icon}</Text>
                <Text style={[ic.sourceLabel, sel && { color: '#FFF' }]}>{src.label}</Text>
                {sel && <Text style={ic.sourceTick}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {anyChecked && (
          <View style={ic.inputWrap}>
            <Text style={ic.inputLabel}>סה"כ הכנסות נוספות לחודש:</Text>
            <View style={ic.inputRow}>
              <Text style={ic.inputPrefix}>₪</Text>
              <TextInput
                style={ic.input}
                value={extraIncome}
                onChangeText={v => setExtra(v.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor="#333"
                keyboardType="numeric"
                textAlign="right"
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[ic.btnPrimary, !anyChecked && ic.btnDisabled]}
          onPress={() => onConfirm(parseInt(extraIncome || '0', 10))}
          disabled={!anyChecked}
          activeOpacity={0.85}
        >
          <Text style={ic.btnPrimaryText}>עדכן חישוב</Text>
        </TouchableOpacity>

        <TouchableOpacity style={ic.btnSecondary} onPress={() => onSkip()}>
          <Text style={ic.btnSecondaryText}>אין — המשך עם המספרים שהכנסתי</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Cash flow alert ─── */
function CashFlowAlert({ data, onContinue }) {
  return (
    <View style={al.wrap}>
      <View style={al.card}>
        <Text style={al.icon}>⚠️</Text>
        <Text style={al.title}>VerMillion מזהה גירעון חודשי</Text>
        <Text style={al.amount}>₪{data.deficit.toLocaleString()}</Text>
        <View style={al.row}>
          <View style={al.stat}>
            <Text style={al.statLabel}>הכנסות</Text>
            <Text style={[al.statVal, { color: '#4CAF50' }]}>₪{data.totalIncome.toLocaleString()}</Text>
          </View>
          <View style={al.divider} />
          <View style={al.stat}>
            <Text style={al.statLabel}>הוצאות</Text>
            <Text style={[al.statVal, { color: '#FF4D4D' }]}>₪{data.totalExpenses.toLocaleString()}</Text>
          </View>
        </View>
        <Text style={al.body}>
          זה בדיוק למה VerMillion קיים. שלב הניתוח יבנה תוכנית שמתייחסת לגירעון הזה ישירות — צעד אחר צעד.
        </Text>
        <TouchableOpacity style={al.btn} onPress={onContinue} activeOpacity={0.85}>
          <Text style={al.btnText}>הבנתי — בואו נטפל בזה</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Main Screen ─── */
export default function DailyQuestionsScreen({ navigation }) {
  const { t } = useLanguage();

  const [onbState, setOnbState]   = useState(null);

  const regDate = onbState?.startDate || new Date().toISOString();
  const ts      = getUserTimeStatus({ registrationDate: regDate, dailyAnswers: onbState || {} });
  const day     = ts.currentDay <= 7 ? ts.currentDay : 7;
  const meta    = DAY_META[day];
  const dayData = DAY_QUESTIONS[day];
  const dayColor = meta?.color || '#C0392B';

  const [step, setStep]         = useState(0);
  const [answers, setAnswers]   = useState({});
  const [showSkip, setShowSkip] = useState(false);
  const [done, setDone]         = useState(false);

  // Life event ack — shown after life_event_recency if NOT long_ago
  const [lifeEventAck, setLifeEventAck] = useState(null); // { familyStatus, recency } | null

  // Income check — shown before cash flow alert on Day 5
  const [incomeCheckData, setIncomeCheckData] = useState(null); // { deficit, totalIncome, totalExpenses } | null

  // Cash flow alert — shown after income check (or directly if skipped)
  const [cashFlowAlert, setCashFlowAlert] = useState(null); // same shape as incomeCheckData | null

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    getOnboardingState().then(s => {
      setOnbState(s);
      const realDay = (() => {
        const rd = s?.startDate || new Date().toISOString();
        const realTs = getUserTimeStatus({ registrationDate: rd, dailyAnswers: s || {} });
        return realTs.currentDay <= 7 ? realTs.currentDay : 7;
      })();
      if ((s?.daysCompleted || []).includes(realDay)) setDone(true);
    });
  }, []);

  // Filter questions by showIf — supports both single value and values[]
  const visibleQuestions = useMemo(() =>
    (dayData?.questions || []).filter(q => {
      if (!q.showIf) return true;
      const val = answers[q.showIf.key];
      return q.showIf.values ? q.showIf.values.includes(val) : val === q.showIf.value;
    }),
    [dayData, answers]
  );

  const current  = visibleQuestions[step];
  const isLast   = step === visibleQuestions.length - 1;
  const progress = visibleQuestions.length > 0 ? (step + 1) / visibleQuestions.length : 0;
  const completion = calcCompletion(onbState || {});

  // Equity hint for mortgage owners (Day 5)
  const isOwner = onbState?.[1]?.housing_type === 'owner';
  const enrichedQuestion = current ? {
    ...current,
    hint: (current.equityHint && isOwner)
      ? 'משכנתא = בניית הון. בכל תשלום חלק חוזר לכיסך — זה לא רק הוצאה, זה חיסכון מאולץ.'
      : current.hint,
  } : null;

  useEffect(() => { animateIn(); }, [step]);

  const animateIn = () => {
    fadeAnim.setValue(0); slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const currentAnswer = answers[current?.key];
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== '' && currentAnswer !== '__skipped__';

  const finalizeDay = async (ans) => {
    const dayAnswers = { ...ans, _answeredAt: new Date().toISOString() };
    await saveOnboardingState({ [day]: dayAnswers });
    await markDayComplete(day);
    setOnbState(s => ({ ...(s || {}), [day]: dayAnswers }));
  };

  const triggerDayEnd = async (newAnswers) => {
    if (day === 5) {
      const allAnswers = { ...(onbState || {}), [day]: newAnswers };
      const alert = detectCashFlowAlert(allAnswers);
      if (alert) {
        await finalizeDay(newAnswers);
        setIncomeCheckData(alert);
        return;
      }
    }
    await finalizeDay(newAnswers);
    setDone(true);
  };

  const advance = async (ans) => {
    const newAnswers = { ...answers, [current.key]: ans };
    setAnswers(newAnswers);

    // Life event recency — trigger ack only if NOT long_ago
    if (current.key === 'life_event_recency' && ans !== 'long_ago') {
      setLifeEventAck({ familyStatus: newAnswers.family_status, recency: ans });
      return;
    }

    if (isLast) {
      await triggerDayEnd(newAnswers);
    } else {
      setStep(s => s + 1);
    }
  };

  const skip = () => { setShowSkip(false); advance('__skipped__'); };

  const continueAfterAck = async () => {
    setLifeEventAck(null);
    if (isLast) { await triggerDayEnd(answers); } else { setStep(s => s + 1); }
  };

  // Income check: user confirmed extra income → recalculate
  const handleIncomeConfirm = (extraAmount) => {
    const prev = incomeCheckData;
    setIncomeCheckData(null);
    if (extraAmount > 0) {
      const day4 = onbState?.[4] || {};
      const patchedAnswers = {
        ...(onbState || {}),
        4: { ...day4, side_income: String((parseFloat(day4.side_income || 0) + extraAmount)) },
      };
      const updated = detectCashFlowAlert(patchedAnswers);
      if (updated) {
        setCashFlowAlert(updated);
      } else {
        setDone(true);
      }
    } else {
      setCashFlowAlert(prev);
    }
  };

  // ── No questions ──
  if (!dayData) {
    return (
      <View style={s.center}>
        <Text style={s.noQ}>{t.dqNoQuestions}</Text>
        <TouchableOpacity style={s.goBtn} onPress={() => navigation.replace('Challenge')}>
          <Text style={s.goBtnText}>{t.dqToChallenge}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Life event ack ──
  if (lifeEventAck) {
    return (
      <LifeEventAck
        familyStatus={lifeEventAck.familyStatus}
        recency={lifeEventAck.recency}
        dayColor={dayColor}
        onContinue={continueAfterAck}
      />
    );
  }

  // ── Income check (Day 5, before cash flow alert) ──
  if (incomeCheckData) {
    return (
      <IncomeCheck
        deficit={incomeCheckData.deficit}
        onConfirm={handleIncomeConfirm}
        onSkip={() => { const d = incomeCheckData; setIncomeCheckData(null); setCashFlowAlert(d); }}
      />
    );
  }

  // ── Cash flow alert ──
  if (cashFlowAlert) {
    return <CashFlowAlert data={cashFlowAlert} onContinue={() => { setCashFlowAlert(null); setDone(true); }} />;
  }

  // ── Completion screen ──
  if (done) {
    return (
      <View style={s.doneWrap}>
        <Text style={[s.doneIcon, { color: dayColor }]}>✓</Text>
        <Text style={s.doneTitle}>{t.dqDoneTitle}</Text>
        <Text style={s.doneSub}>{t.dqDoneSub}</Text>
        <View style={s.doneCompletion}>
          <Text style={s.doneCompLabel}>{t.dqDoneCompLabel}</Text>
          <Text style={[s.doneCompPct, { color: dayColor }]}>~{Math.min(completion + 14, 100)}%</Text>
        </View>
        <TouchableOpacity style={[s.goBtn, { backgroundColor: dayColor }]} onPress={() => navigation.replace('MainTabs', { screen: 'Home' })}>
          <Text style={s.goBtnText}>{t.dqDoneBtn}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}>
            <Text style={s.back}>←</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={s.progressBg}>
              <Animated.View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: dayColor }]} />
            </View>
            <Text style={s.progressLabel}>{t.dqQuestion(step + 1, visibleQuestions.length)}</Text>
          </View>
          <View style={[s.completionBadge, { borderColor: dayColor + '55' }]}>
            <Text style={[s.completionText, { color: dayColor }]}>{completion}%</Text>
          </View>
        </View>

        {/* Day topic */}
        <View style={s.topicRow}>
          <Text style={s.topicIcon}>{meta?.icon}</Text>
          <Text style={[s.topicLabel, { color: dayColor }]}>{t.dqDayLabel(day, meta?.topic)}</Text>
        </View>

        {/* Intro (step 0) */}
        {step === 0 && (
          <View style={s.introBox}><Text style={s.introText}>{dayData.intro}</Text></View>
        )}

        {/* Speech bubble */}
        <Animated.View style={[s.speechWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[s.vmCircle, { backgroundColor: dayColor }]}>
            <Text style={s.vmLetter}>V</Text>
          </View>
          <View style={s.bubble}>
            <Text style={s.bubbleText}>{enrichedQuestion?.question}</Text>
            {enrichedQuestion?.type === 'document' && enrichedQuestion?.optional && (
              <Text style={s.optionalTag}>{t.dqOptional}</Text>
            )}
          </View>
        </Animated.View>

        {/* Answer area */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], minHeight: 200 }}>
          {enrichedQuestion?.type === 'choice' && (
            <ChoiceQuestion question={enrichedQuestion} value={currentAnswer}
              onSelect={(v) => setAnswers(a => ({ ...a, [current.key]: v }))} dayColor={dayColor} />
          )}
          {enrichedQuestion?.type === 'number' && (
            <NumberQuestion question={enrichedQuestion} value={currentAnswer || ''}
              onChange={(v) => setAnswers(a => ({ ...a, [current.key]: v }))} dayColor={dayColor} />
          )}
          {enrichedQuestion?.type === 'open' && (
            <OpenQuestion question={enrichedQuestion} value={currentAnswer || ''}
              onChange={(v) => setAnswers(a => ({ ...a, [current.key]: v }))} />
          )}
          {enrichedQuestion?.type === 'document' && (
            <DocumentUpload question={enrichedQuestion}
              uploaded={typeof currentAnswer === 'object' ? currentAnswer : null}
              onUpload={(file) => setAnswers(a => ({ ...a, [current.key]: file }))}
              onSkip={() => advance('__skipped__')} dayColor={dayColor} t={t} />
          )}
        </Animated.View>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: dayColor }, !hasAnswer && s.nextBtnDisabled]}
            onPress={() => advance(currentAnswer)}
            disabled={!hasAnswer}
          >
            <Text style={s.nextBtnText}>{isLast ? t.dqFinish : t.dqNext}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.skipBtn} onPress={() => {
            if (enrichedQuestion?.type === 'choice' || enrichedQuestion?.type === 'open') {
              setShowSkip(true);
            } else {
              advance('__skipped__');
            }
          }}>
            <Text style={s.skipBtnText}>{t.dqLeaveBlank}</Text>
          </TouchableOpacity>
        </View>

        {/* Blind spot hint */}
        {enrichedQuestion?.blindSpot && (
          <View style={s.blindSpotHint}>
            <Text style={s.blindSpotIcon}>👁</Text>
            <Text style={s.blindSpotText}>
              {t.dqBlindSpotPrefix}
              <Text style={s.blindSpotBold}>{enrichedQuestion.blindSpot}</Text>
            </Text>
          </View>
        )}

      </ScrollView>

      <SkipDialog visible={showSkip} blindSpot={enrichedQuestion?.blindSpot}
        onSkip={skip} onStay={() => setShowSkip(false)} t={t} />
    </KeyboardAvoidingView>
  );
}

/* ─── Styles ─── */
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { paddingTop: 56, paddingHorizontal: 22, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', gap: 16 },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  back:            { color: '#555', fontSize: 22 },
  headerCenter:    { flex: 1, gap: 6 },
  progressBg:      { height: 3, backgroundColor: '#1E1E1E', borderRadius: 2, overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: 2 },
  progressLabel:   { color: '#444', fontSize: 11 },
  completionBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  completionText:  { fontSize: 11, fontWeight: '800' },
  topicRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  topicIcon: { fontSize: 18 },
  topicLabel:{ fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  introBox:  { backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#1E1E1E' },
  introText: { color: '#888', fontSize: 14, lineHeight: 22, textAlign: 'right' },
  speechWrap:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  vmCircle:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  vmLetter:    { color: '#FFF', fontSize: 20, fontWeight: '900' },
  bubble:      { flex: 1, backgroundColor: '#111', borderRadius: 18, borderTopLeftRadius: 4, padding: 16, borderWidth: 1, borderColor: '#1E1E1E' },
  bubbleText:  { color: '#FFF', fontSize: 18, fontWeight: '700', lineHeight: 26, textAlign: 'right' },
  optionalTag: { color: '#555', fontSize: 11, textAlign: 'right', marginTop: 6 },
  actions:         { gap: 12, marginTop: 8 },
  nextBtn:         { borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnText:     { color: '#FFF', fontSize: 16, fontWeight: '800' },
  skipBtn:         { alignItems: 'center', paddingVertical: 10 },
  skipBtnText:     { color: '#444', fontSize: 14 },
  blindSpotHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 20, backgroundColor: '#0F0F0F', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1A1A1A' },
  blindSpotIcon: { fontSize: 14 },
  blindSpotText: { flex: 1, color: '#444', fontSize: 12, lineHeight: 18, textAlign: 'right' },
  blindSpotBold: { color: '#666', fontWeight: '700' },
  noQ:       { color: '#555', fontSize: 16 },
  goBtn:     { backgroundColor: '#C0392B', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 16, marginTop: 8 },
  goBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  doneWrap:       { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  doneIcon:       { fontSize: 56 },
  doneTitle:      { color: '#FFF', fontSize: 32, fontWeight: '900' },
  doneSub:        { color: '#555', fontSize: 15, textAlign: 'center' },
  doneCompletion: { alignItems: 'center', marginVertical: 8 },
  doneCompLabel:  { color: '#555', fontSize: 13 },
  doneCompPct:    { fontSize: 48, fontWeight: '900' },
});

const ch = StyleSheet.create({
  wrap:        { gap: 10 },
  option:      { backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1E1E1E', padding: 16 },
  optionInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  radioFill:   { width: 10, height: 10, borderRadius: 5 },
  optionText:  { flex: 1 },
  optionLabel: { color: '#888', fontSize: 15, fontWeight: '600', textAlign: 'right' },
  optionSub:   { color: '#444', fontSize: 12, textAlign: 'right', marginTop: 2 },
  check:       { fontSize: 16, fontWeight: '800' },
});

const nm = StyleSheet.create({
  wrap:      { gap: 10 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, borderWidth: 1.5, borderColor: '#1E1E1E', paddingHorizontal: 20, height: 72 },
  prefix:    { color: '#444', fontSize: 28, fontWeight: '700', marginRight: 8 },
  input:     { flex: 1, color: '#FFF', fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  suffix:    { color: '#555', fontSize: 16, marginLeft: 8 },
  hint:      { color: '#444', fontSize: 12, textAlign: 'right', paddingHorizontal: 4 },
});

const op = StyleSheet.create({
  input: { backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1E1E1E', padding: 18, color: '#FFF', fontSize: 16, minHeight: 120, lineHeight: 24 },
});

const doc = StyleSheet.create({
  wrap:       { gap: 12 },
  dropzone:   { backgroundColor: '#111', borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', padding: 28, alignItems: 'center', gap: 8 },
  dropIcon:   { fontSize: 36 },
  dropTitle:  { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dropSub:    { color: '#555', fontSize: 13 },
  btnRow:     { flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  typeBtn:    { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  typeBtnText:{ fontSize: 13, fontWeight: '600' },
  uploading:    { alignItems: 'center', paddingVertical: 16 },
  uploadingText:{ fontSize: 16, fontWeight: '700' },
  successBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  successIcon:  { fontSize: 24, color: '#27AE60' },
  successInfo:  { flex: 1 },
  successName:  { fontSize: 14, fontWeight: '700' },
  successSize:  { color: '#555', fontSize: 12, marginTop: 2 },
  successRemove:{ color: '#444', fontSize: 18 },
  hintBox:  { flexDirection: 'row', gap: 8, backgroundColor: '#0F0F0F', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1A1A1A' },
  hintIcon: { fontSize: 14 },
  hintText: { flex: 1, color: '#555', fontSize: 12, lineHeight: 18, textAlign: 'right' },
  skipDoc:    { alignItems: 'center', paddingVertical: 8 },
  skipDocText:{ color: '#444', fontSize: 14 },
});

const d = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  sheet:       { backgroundColor: '#111', borderRadius: 24, padding: 28, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#1E1E1E', gap: 12 },
  icon:        { fontSize: 36 },
  title:       { color: '#FFF', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  body:        { color: '#888', fontSize: 15, lineHeight: 24, textAlign: 'center' },
  row:         { flexDirection: 'row', gap: 12, marginTop: 4, width: '100%' },
  btnSkip:     { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnSkipText: { color: '#555', fontSize: 14 },
  btnStay:     { flex: 1.4, backgroundColor: '#C0392B', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnStayText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});

const ack = StyleSheet.create({
  wrap:    { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', padding: 36, gap: 20 },
  icon:    { fontSize: 64 },
  title:   { color: '#FFF', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  body:    { color: '#888', fontSize: 16, lineHeight: 26, textAlign: 'center' },
  btn:     { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 48, marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

const al = StyleSheet.create({
  wrap:      { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:      { backgroundColor: '#111', borderRadius: 24, padding: 28, width: '100%', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#F39C1233' },
  icon:      { fontSize: 48 },
  title:     { color: '#F39C12', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  amount:    { color: '#FF4D4D', fontSize: 52, fontWeight: '900' },
  row:       { flexDirection: 'row', gap: 24, alignItems: 'center' },
  stat:      { alignItems: 'center', gap: 4 },
  statLabel: { color: '#555', fontSize: 12 },
  statVal:   { fontSize: 18, fontWeight: '800' },
  divider:   { width: 1, height: 32, backgroundColor: '#222' },
  body:      { color: '#666', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  btn:       { backgroundColor: '#F39C12', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 32, marginTop: 4, width: '100%', alignItems: 'center' },
  btnText:   { color: '#000', fontSize: 15, fontWeight: '900' },
});

const ic = StyleSheet.create({
  wrap:         { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card:         { backgroundColor: '#111', borderRadius: 24, padding: 24, width: '100%', gap: 14, borderWidth: 1, borderColor: '#2980B933' },
  icon:         { fontSize: 40, textAlign: 'center' },
  title:        { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle:     { color: '#888', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  examples:     { color: '#555', fontSize: 12, textAlign: 'right' },
  sources:      { gap: 8 },
  sourceRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0F0F0F', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1A1A1A' },
  sourceRowSel: { borderColor: '#2980B9', backgroundColor: '#2980B915' },
  sourceIcon:   { fontSize: 20 },
  sourceLabel:  { flex: 1, color: '#888', fontSize: 14, fontWeight: '600', textAlign: 'right' },
  sourceTick:   { color: '#2980B9', fontSize: 16, fontWeight: '800' },
  inputWrap:    { gap: 8 },
  inputLabel:   { color: '#888', fontSize: 13, textAlign: 'right' },
  inputRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F0F0F', borderRadius: 12, borderWidth: 1.5, borderColor: '#2980B9', paddingHorizontal: 16, height: 60 },
  inputPrefix:  { color: '#2980B9', fontSize: 22, fontWeight: '700', marginRight: 8 },
  input:        { flex: 1, color: '#FFF', fontSize: 24, fontWeight: '800' },
  btnPrimary:   { backgroundColor: '#2980B9', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled:  { opacity: 0.35 },
  btnPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  btnSecondary:   { alignItems: 'center', paddingVertical: 10 },
  btnSecondaryText: { color: '#444', fontSize: 13 },
});
