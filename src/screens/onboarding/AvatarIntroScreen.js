import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { saveFinancialData } from '../../services/storage';

function parseStatus(text) {
  const t = (text || '').toLowerCase();
  if (/נשו|נשוי|נשואה/.test(t))         return 'נשוי';
  if (/גרו|גרוש|גרושה|פרוד/.test(t))   return 'גרוש';
  if (/זוגי|זוג|חבר|חברה|יחד/.test(t)) return 'זוגי';
  return 'רווק';
}

function parseOccupation(text) {
  const t = (text || '').toLowerCase();
  if (/שכיר|עובד|משכורת|עובדת/.test(t))     return 'שכיר';
  if (/עצמאי|עוסק|עסק|פרילנס/.test(t))       return 'עצמאי';
  if (/סטודנט|תלמיד|לומד/.test(t))           return 'סטודנט';
  if (/מובטל|לא עובד/.test(t))               return 'מובטל';
  if (/פנסי/.test(t))                         return 'פנסיונר';
  return text;
}

export default function AvatarIntroScreen({ navigation, route }) {
  const { appearance, tone } = route.params;
  const { t } = useLanguage();
  const DAY1_QUESTIONS = t.introQuestions;

  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);

  const current = DAY1_QUESTIONS[step];
  const isLast = step === DAY1_QUESTIONS.length - 1;
  const progress = (step + 1) / DAY1_QUESTIONS.length;
  const val = answers[current.key] || '';

  const next = () => {
    if (!val.trim()) return;
    const newDay1Answers = { ...answers, [current.key]: val };
    if (isLast) {
      saveFinancialData({
        familyStatus:   parseStatus(newDay1Answers.status),
        employmentType: parseOccupation(newDay1Answers.occupation),
        city:           newDay1Answers.city || '',
      }).catch(() => {});
      navigation.navigate('AvatarReveal', { appearance, tone, day1: newDay1Answers });
    } else {
      setAnswers(newDay1Answers);
      setStep(step + 1);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}>
            <Text style={styles.back}>{t.avatarBack}</Text>
          </TouchableOpacity>
          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{t.introProgressLabel(step + 1, DAY1_QUESTIONS.length)}</Text>
          </View>
        </View>

        <Text style={styles.stepBadge}>{t.introStepBadge}</Text>

        {/* VerMillion speaks */}
        <View style={styles.vermillionSpeech}>
          <View style={styles.vermillionAvatar}>
            <Text style={styles.vermillionAvatarText}>V</Text>
          </View>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{current.question}</Text>
          </View>
        </View>

        <TextInput
          style={styles.input}
          value={val}
          onChangeText={(v) => setAnswers({ ...answers, [current.key]: v })}
          placeholder={current.placeholder}
          placeholderTextColor="#333"
          textAlign="right"
          autoFocus
          returnKeyType={isLast ? 'done' : 'next'}
          onSubmitEditing={next}
        />

        <TouchableOpacity
          style={[styles.nextBtn, !val.trim() && styles.nextBtnDisabled]}
          onPress={next}
          disabled={!val.trim()}
        >
          <Text style={styles.nextBtnText}>{isLast ? t.introRevealBtn : t.introNextBtn}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  inner: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  back: { color: '#555', fontSize: 22 },
  progressWrap: { flex: 1, gap: 6 },
  progressBg: { height: 4, backgroundColor: '#1E1E1E', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#C0392B', borderRadius: 2 },
  progressLabel: { color: '#444', fontSize: 11 },
  stepBadge: { color: '#C0392B', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 32 },

  vermillionSpeech: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 32 },
  vermillionAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  vermillionAvatarText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  speechBubble: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 18, borderTopLeftRadius: 4,
    padding: 18,
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  speechText: { color: '#FFF', fontSize: 20, fontWeight: '700', lineHeight: 28, textAlign: 'right' },

  input: {
    backgroundColor: '#111',
    borderRadius: 14, borderWidth: 1, borderColor: '#1E1E1E',
    padding: 18, color: '#FFF', fontSize: 20,
    marginBottom: 24, textAlign: 'right',
  },

  nextBtn: {
    backgroundColor: '#C0392B',
    borderRadius: 14, paddingVertical: 18,
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: '#2A1010', opacity: 0.5 },
  nextBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
