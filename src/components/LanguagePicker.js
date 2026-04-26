import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

export default function LanguagePicker({ style }) {
  const { lang, setLang, LANGUAGES } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang);

  return (
    <>
      <TouchableOpacity style={[styles.btn, style]} onPress={() => setOpen(true)}>
        <Text style={styles.flag}>{current.flag}</Text>
        <Text style={styles.code}>{current.code.toUpperCase()}</Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Choose Language</Text>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[styles.option, lang === l.code && styles.optionActive]}
                onPress={() => { setLang(l.code); setOpen(false); }}
              >
                <Text style={styles.optionFlag}>{l.flag}</Text>
                <Text style={[styles.optionName, lang === l.code && styles.optionNameActive]}>
                  {l.name}
                </Text>
                {lang === l.code && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#151515',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  flag: { fontSize: 16 },
  code: { color: '#888', fontSize: 12, fontWeight: '700' },
  arrow: { color: '#555', fontSize: 10 },

  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  sheetTitle: { color: '#555', fontSize: 12, letterSpacing: 2, marginBottom: 16, textAlign: 'center' },
  option: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 14, gap: 14,
    marginBottom: 8, backgroundColor: '#151515',
  },
  optionActive: { backgroundColor: '#1A0E0E', borderWidth: 1, borderColor: '#C0392B' },
  optionFlag: { fontSize: 24 },
  optionName: { flex: 1, color: '#888', fontSize: 16, fontWeight: '600' },
  optionNameActive: { color: '#FFF' },
  check: { color: '#C0392B', fontSize: 16, fontWeight: '700' },
});
