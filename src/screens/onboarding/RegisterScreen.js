import React from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← חזור</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t.registerShortTitle}</Text>
        <Text style={styles.subtitle}>{t.registerShortSub}</Text>

        <View style={styles.note}>
          <Text style={styles.noteText}>1. {t.loginEmailSubtitle}</Text>
          <Text style={styles.noteText}>2. {t.cpStepLabel}</Text>
          <Text style={styles.noteText}>3. VerMillion</Text>
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.88}
        >
          <Text style={styles.btnText}>{t.registerCtaEmail}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  inner: { padding: 24, paddingTop: 12, paddingBottom: 40 },
  back: { marginBottom: 28 },
  backText: { color: '#888', fontSize: 16 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginBottom: 12, textAlign: 'right' },
  subtitle: { fontSize: 15, color: '#777', marginBottom: 28, textAlign: 'right', lineHeight: 22 },
  note: {
    backgroundColor: '#151515',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#252525',
    gap: 10,
    marginBottom: 28,
  },
  noteText: { color: '#AAA', fontSize: 14, textAlign: 'right', lineHeight: 22 },
  btn: {
    backgroundColor: '#C0392B',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
