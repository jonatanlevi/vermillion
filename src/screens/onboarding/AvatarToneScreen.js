import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';

export default function AvatarToneScreen({ navigation, route }) {
  const { appearance } = route.params;
  const { t } = useLanguage();
  const QUESTIONS = t.toneQuestions;

  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);

  const current = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const progress = (step + 1) / QUESTIONS.length;

  const select = (value) => {
    const newAnswers = { ...answers, [current.key]: value };
    setAnswers(newAnswers);
    
    setTimeout(() => {
      if (isLast) {
        navigation.navigate('AvatarIntro', { appearance, tone: newAnswers });
      } else {
        setStep(step + 1);
      }
    }, 300);
  };

  const selectedOption = answers[current.key];

  return (
    <View style={styles.container}>

      {/* Progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}>
          <Text style={styles.back}>{t.avatarBack}</Text>
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{step + 1} / {QUESTIONS.length}</Text>
        </View>
      </View>

      <Text style={styles.stepBadge}>{t.toneStepBadge}</Text>
      <Text style={styles.question}>{current.question}</Text>

      <View style={styles.options}>
        {current.options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.option, selectedOption === opt.value && styles.optionSelected]}
            onPress={() => select(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={styles.optionEmoji}>{opt.emoji}</Text>
            <View style={styles.optionText}>
              <Text style={[styles.optionLabel, selectedOption === opt.value && styles.optionLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </View>
            {selectedOption === opt.value && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', paddingTop: 56, paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  back: { color: '#555', fontSize: 22 },
  progressWrap: { flex: 1, gap: 6 },
  progressBg: { height: 4, backgroundColor: '#1E1E1E', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#C0392B', borderRadius: 2 },
  progressLabel: { color: '#444', fontSize: 11 },
  stepBadge: { color: '#C0392B', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 16 },
  question: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 32, textAlign: 'right', lineHeight: 32 },
  options: { gap: 14 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 18,
    padding: 20, gap: 16,
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  optionSelected: { backgroundColor: '#1A0E0E', borderColor: '#C0392B' },
  optionEmoji: { fontSize: 28 },
  optionText: { flex: 1 },
  optionLabel: { color: '#888', fontSize: 16, fontWeight: '700', marginBottom: 3 },
  optionLabelSelected: { color: '#FFF' },
  optionDesc: { color: '#444', fontSize: 13 },
  check: { color: '#C0392B', fontSize: 18, fontWeight: '800' },
});
