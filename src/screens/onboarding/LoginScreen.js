import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import { signInWithEmailOtp, verifyEmailOtp } from '../../services/authService';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSend() {
    setError('');
    setLoading(true);
    try {
      await signInWithEmailOtp(email);
      setSent(true);
    } catch (e) {
      if (e?.code === 'INVALID_EMAIL' || e?.message === 'INVALID_EMAIL') {
        setError(t.loginInvalidEmail);
      } else {
        setError(e?.message || t.loginSendError);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onVerify() {
    setError('');
    setLoading(true);
    try {
      await verifyEmailOtp(email, otp);
    } catch {
      setError(t.loginVerifyError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t.loginEmailTitle}</Text>
        <Text style={styles.subtitle}>{t.loginEmailSubtitle}</Text>

        <Text style={styles.label}>{t.loginEmailLabel}</Text>
        <TextInput
          style={[styles.input, sent && styles.inputDisabled]}
          placeholder={t.loginEmailPh}
          placeholderTextColor="#444"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!sent}
          textAlign="right"
        />

        {sent && (
          <>
            <Text style={styles.hint}>{t.loginEmailSent}</Text>
            <Text style={styles.label}>{t.loginOtpLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor="#444"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={8}
              textAlign="center"
            />
          </>
        )}

        {!!error && <Text style={styles.err}>{error}</Text>}

        {!sent ? (
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            disabled={loading || !email.trim()}
            onPress={onSend}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>{t.loginSendLink}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.row}>
            <TouchableOpacity style={styles.secondary} onPress={() => { setSent(false); setOtp(''); setError(''); }}>
              <Text style={styles.secondaryText}>{t.loginBackEdit}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnFlex, loading && styles.btnDisabled]}
              disabled={loading || otp.trim().length < 4}
              onPress={onVerify}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>{t.loginVerify}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  inner: { padding: 24, paddingTop: 12 },
  back: { marginBottom: 24, alignSelf: 'flex-start' },
  backText: { color: '#888', fontSize: 22 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 8, textAlign: 'right' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 28, textAlign: 'right', lineHeight: 20 },
  label: { color: '#888', fontSize: 13, marginBottom: 8, textAlign: 'right' },
  hint: { color: '#888', fontSize: 13, marginBottom: 16, textAlign: 'right', lineHeight: 20 },
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
  inputDisabled: { opacity: 0.55 },
  err: { color: '#E74C3C', fontSize: 13, marginBottom: 12, textAlign: 'right' },
  btn: {
    backgroundColor: '#C0392B',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  btnFlex: { flex: 1, marginTop: 0 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginTop: 8 },
  secondary: { paddingVertical: 14, paddingHorizontal: 8 },
  secondaryText: { color: '#888', fontSize: 14 },
});
