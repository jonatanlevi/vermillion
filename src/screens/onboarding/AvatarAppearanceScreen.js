import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';

export default function AvatarAppearanceScreen({ navigation }) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const QUESTIONS = t.avatarQuestions;

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
        navigation.navigate('AvatarTone', { appearance: newAnswers });
      } else {
        setStep(step + 1);
      }
    }, 300);
  };

  const selectedOption = answers[current.key];

  const hintText = Object.keys(answers).length === 0
    ? t.avatarHintEmpty
    : Object.values(answers).map(v => {
        for (const q of QUESTIONS) {
          const opt = q.options.find(o => o.value === v);
          if (opt) return opt.label;
        }
        return '';
      }).join(' · ');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>

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

      {/* Step label */}
      <View style={styles.stepLabel}>
        <Text style={styles.stepBadge}>{t.avatarStepBadge}</Text>
        <Text style={styles.stepExplain}>האווטר שלך ישתנה חזותית לפי הטייר הפיננסי שלך — ביום 8 תראה מי אתה באמת</Text>
      </View>

      {/* Avatar preview */}
      <View style={styles.avatarPreview}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>
            {answers.style ? QUESTIONS[1].options.find(o => o.value === answers.style)?.emoji : '👤'}
          </Text>
        </View>
        <Text style={styles.avatarHint}>{hintText}</Text>
      </View>

      {/* Question */}
      <Text style={styles.question}>{current.question}</Text>

      {/* Options */}
      <View style={styles.options}>
        {current.options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.option, selectedOption === opt.value && styles.optionSelected]}
            onPress={() => select(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={styles.optionEmoji}>{opt.emoji}</Text>
            <Text style={[styles.optionLabel, selectedOption === opt.value && styles.optionLabelSelected]}>
              {opt.label}
            </Text>
            {selectedOption === opt.value && <Text style={styles.optionCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', paddingHorizontal: 24 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  back: { color: '#555', fontSize: 22 },
  progressWrap: { flex: 1, gap: 6 },
  progressBg: { height: 4, backgroundColor: '#1E1E1E', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#C0392B', borderRadius: 2 },
  progressLabel: { color: '#444', fontSize: 11 },

  stepLabel: { marginBottom: 24 },
  stepBadge: { color: '#C0392B', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  stepExplain: { color: '#444', fontSize: 12, marginTop: 6, lineHeight: 18 },

  avatarPreview: { alignItems: 'center', marginBottom: 32 },
  avatarCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#C0392B',
    marginBottom: 10,
  },
  avatarEmoji: { fontSize: 44 },
  avatarHint: { color: '#555', fontSize: 13, textAlign: 'center' },

  question: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 24, textAlign: 'right' },

  options: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 16,
    padding: 18, gap: 14,
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  optionSelected: { backgroundColor: '#1A0E0E', borderColor: '#C0392B' },
  optionEmoji: { fontSize: 26 },
  optionLabel: { flex: 1, color: '#888', fontSize: 16, fontWeight: '600' },
  optionLabelSelected: { color: '#FFF' },
  optionCheck: { color: '#C0392B', fontSize: 16, fontWeight: '800' },
});
