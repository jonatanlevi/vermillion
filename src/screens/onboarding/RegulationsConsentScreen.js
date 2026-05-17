import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { REGULATIONS_VERSION, REGULATION_SECTIONS } from '../../constants/regulationsHe';
import { CHALLENGE_WINDOWS } from '../../constants/stampChallenge';
import { saveProfile } from '../../services/storage';
import { markLocalTermsAccepted } from '../../utils/registrationGate';
import { useAuth } from '../../context/AuthContext';

const FRI = CHALLENGE_WINDOWS.FRIDAY;
const SAT = CHALLENGE_WINDOWS.SATURDAY;

export default function RegulationsConsentScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, reloadProfile } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAccept() {
    if (!agreed || saving) return;
    setSaving(true);
    const acceptedAt = new Date().toISOString();
    try {
      await saveProfile({
        terms_accepted_at: acceptedAt,
        terms_version: REGULATIONS_VERSION,
      });
      markLocalTermsAccepted(user?.id);
      await reloadProfile?.();
    } catch {
      markLocalTermsAccepted(user?.id);
    }
    setSaving(false);
    navigation.replace('ModelDownload');
  }

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>תקנון והסכמה</Text>
        <Text style={s.headerSub}>לפני שממשיכים — חוזי הזמן והמשחק</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.version}>גרסה {REGULATIONS_VERSION}</Text>

        {REGULATION_SECTIONS.map((sec) => (
          <View key={sec.id} style={s.block}>
            <Text style={s.blockTitle}>{sec.title}</Text>
            {sec.subtitle ? <Text style={s.blockSub}>{sec.subtitle}</Text> : null}
            {sec.body.map((line, i) => (
              <Text key={i} style={s.para}>{line}</Text>
            ))}
          </View>
        ))}

        <View style={s.highlight}>
          <Text style={s.highlightTitle}>בקצרה — שעות לפי היום שלך</Text>
          <Text style={s.highlightLine}>ימי חול: DNA מההרשמה (נעול)</Text>
          <Text style={s.highlightLine}>
            שישי: {FRI.openLabel}–{FRI.closeLabel} — שעה שבחרת (נעולה)
          </Text>
          <Text style={s.highlightLine}>
            שבת: {SAT.openLabel}–{SAT.closeLabel} — שעה שבחרת (נעולה)
          </Text>
          <Text style={s.highlightLine}>ראשון: חוזרים ל-DNA יומי</Text>
          <Text style={s.highlightNote}>השעון לפי המכשיר שלך ברגע הפעולה</Text>
        </View>

        <TouchableOpacity
          style={s.linkBtn}
          onPress={() => navigation.navigate('Regulations')}
          activeOpacity={0.8}
        >
          <Text style={s.linkText}>פתח תקנון מלא (תוכן עניינים) ›</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.checkRow}
          onPress={() => setAgreed((v) => !v)}
          activeOpacity={0.8}
        >
          <View style={[s.checkbox, agreed && s.checkboxOn]}>
            {agreed ? <Text style={s.checkMark}>✓</Text> : null}
          </View>
          <Text style={s.checkLabel}>
            קראתי ואני מסכים/ה לתקנון, לחוזי הזמן (DNA, שישי ושבת), ולאימות המשחק והחתימה
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.acceptBtn, (!agreed || saving) && s.acceptBtnOff]}
          onPress={handleAccept}
          disabled={!agreed || saving}
          activeOpacity={0.85}
        >
          <Text style={s.acceptText}>{saving ? 'שומר...' : 'אני מסכים/ה — המשך'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'right' },
  headerSub: { color: '#888', fontSize: 13, textAlign: 'right', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  version: { color: '#555', fontSize: 11, textAlign: 'right', marginBottom: 12 },
  block: { marginBottom: 20 },
  blockTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', textAlign: 'right', marginBottom: 4 },
  blockSub: { color: '#D4AF37', fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 8 },
  para: { color: '#BBB', fontSize: 13, lineHeight: 22, textAlign: 'right', marginBottom: 6 },
  highlight: {
    backgroundColor: '#141008',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4AF3744',
    padding: 14,
    marginBottom: 16,
  },
  highlightTitle: { color: '#D4AF37', fontSize: 14, fontWeight: '800', textAlign: 'right', marginBottom: 8 },
  highlightLine: { color: '#CCC', fontSize: 13, textAlign: 'right', marginBottom: 4 },
  highlightNote: { color: '#666', fontSize: 11, textAlign: 'right', marginTop: 6 },
  linkBtn: { alignItems: 'flex-end', paddingVertical: 8 },
  linkText: { color: '#C0392B', fontSize: 14, fontWeight: '700' },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    backgroundColor: '#0A0A0A',
  },
  checkRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#555',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxOn: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  checkMark: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  checkLabel: { flex: 1, color: '#DDD', fontSize: 13, lineHeight: 20, textAlign: 'right' },
  acceptBtn: {
    backgroundColor: '#C0392B',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptBtnOff: { opacity: 0.4 },
  acceptText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
