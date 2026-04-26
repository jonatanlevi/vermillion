import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← חזור</Text>
        </TouchableOpacity>

        <Text style={styles.title}>כניסה</Text>
        <Text style={styles.subtitle}>נשלח לך קוד אימות ב-SMS</Text>

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
          style={[styles.btn, phone.length < 9 && styles.btnDisabled]}
          disabled={phone.length < 9}
          onPress={() => navigation.replace('MainTabs')}
        >
          <Text style={styles.btnText}>שלח קוד</Text>
        </TouchableOpacity>
      </View>
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
  label: { color: '#888', fontSize: 13, marginBottom: 8, textAlign: 'right' },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  btn: {
    backgroundColor: '#C0392B',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#3A1A1A' },
  btnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
