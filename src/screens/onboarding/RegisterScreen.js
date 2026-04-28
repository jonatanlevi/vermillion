import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearAllData } from '../../services/storage';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);

  const canSubmit = name.length > 1 && phone.length >= 9 && agreed;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← חזור</Text>
        </TouchableOpacity>

        <Text style={styles.title}>יצירת חשבון</Text>
        <Text style={styles.subtitle}>7 ימי ניסיון חינם, ואז ₪79/חודש</Text>

        <View style={styles.form}>
          <Text style={styles.label}>שם מלא</Text>
          <TextInput
            style={styles.input}
            placeholder="ישראל ישראלי"
            placeholderTextColor="#444"
            value={name}
            onChangeText={setName}
            textAlign="right"
          />

          <Text style={styles.label}>מספר טלפון</Text>
          <TextInput
            style={styles.input}
            placeholder="050-0000000"
            placeholderTextColor="#444"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textAlign="right"
          />

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkText}>
              קראתי ואני מסכים לתנאי השימוש
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, !canSubmit && styles.btnDisabled]}
          disabled={!canSubmit}
          onPress={async () => { await clearAllData(); navigation.navigate('CompleteProfile'); }}
        >
          <Text style={styles.btnText}>התחל שבוע ניסיון</Text>
        </TouchableOpacity>

        <View style={styles.onboardingNote}>
          <Text style={styles.onboardingNoteText}>
            🎯 תצטרך להשתתף 7 ימים רצופים כדי לפתוח את המנוי
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  inner: { padding: 24, paddingTop: 12 },
  back: { marginBottom: 32 },
  backText: { color: '#888', fontSize: 16 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 40 },
  form: { gap: 8, marginBottom: 32 },
  label: { color: '#888', fontSize: 13, marginBottom: 4, textAlign: 'right' },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  checkRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 24, height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  checkmark: { color: '#FFF', fontWeight: '700' },
  checkText: { color: '#888', fontSize: 14 },
  btn: {
    backgroundColor: '#C0392B',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnDisabled: { backgroundColor: '#3A1A1A' },
  btnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  onboardingNote: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  onboardingNoteText: { color: '#888', fontSize: 13, textAlign: 'center' },
});
