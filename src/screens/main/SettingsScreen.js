import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockUser } from '../../mock/data';
import { getAIStatus, resetConversation } from '../../services/aiService';
import { getUserTimeStatus } from '../../services/timeEngine';
import { useLanguage } from '../../context/LanguageContext';

function SettingRow({ label, value, onPress, valueStyle }) {
  const content = (
    <View style={s.row}>
      <Text style={[s.rowValue, valueStyle]}>{value}</Text>
      <Text style={s.rowLabel}>{label}</Text>
    </View>
  );
  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

function SectionHeader({ title }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

function Divider() {
  return <View style={s.divider} />;
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [aiOnline, setAiOnline] = useState(null);
  const ts = getUserTimeStatus(mockUser);
  const isPremium = mockUser.subscription === 'premium';

  useEffect(() => {
    getAIStatus().then(setAiOnline);
  }, []);

  const aiStatusLabel =
    aiOnline === null ? '...' : aiOnline ? '● Online' : t.settingsValDemoMode;
  const aiStatusColor =
    aiOnline === null ? '#888' : aiOnline ? '#4CAF50' : '#F39C12';

  const handleCancelSubscription = () => {
    Alert.alert(
      t.settingsCancelAlert.title,
      t.settingsCancelAlert.msg,
      [{ text: t.settingsCancelAlert.cancel, style: 'cancel' }, { text: t.settingsCancelAlert.confirm, style: 'destructive' }]
    );
  };

  const handleResetQuestionnaire = () => {
    Alert.alert(t.settingsResetQAlert.title, t.settingsResetQAlert.msg);
  };

  const handleClearChat = () => {
    resetConversation();
    Alert.alert('', t.settingsClearChatDone);
  };

  const handleLogout = () => {
    Alert.alert(t.settingsLogoutAlert.title, t.settingsLogoutAlert.msg, [
      { text: t.settingsLogoutAlert.cancel, style: 'cancel' },
      { text: t.settingsLogoutAlert.confirm, style: 'destructive', onPress: () => navigation.replace('Splash') },
    ]);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t.settingsTitle}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <SectionHeader title={t.settingsSectionAccount} />
        <View style={s.card}>
          <SettingRow label={t.settingsRowName} value={mockUser.name} />
          <Divider />
          <SettingRow
            label={t.settingsRowSub}
            value={isPremium ? t.settingsValPremium : t.settingsValFree}
            valueStyle={{ color: isPremium ? '#4CAF50' : '#888888' }}
          />
          <Divider />
          <SettingRow
            label={t.settingsRowCancelSub}
            value={t.settingsValCancel}
            valueStyle={s.redValue}
            onPress={handleCancelSubscription}
          />
        </View>

        <SectionHeader title={t.settingsSectionAI} />
        <View style={s.card}>
          <SettingRow label={t.settingsRowAIModel} value="qwen2.5:3b" />
          <Divider />
          <SettingRow
            label={t.settingsRowConnection}
            value={aiStatusLabel}
            valueStyle={{ color: aiStatusColor }}
          />
          <Divider />
          <SettingRow
            label={t.settingsRowClearChat}
            value={t.settingsValClear}
            valueStyle={s.mutedValue}
            onPress={handleClearChat}
          />
        </View>

        <SectionHeader title={t.settingsSectionProfiling} />
        <View style={s.card}>
          <SettingRow
            label={t.settingsRowResetQ}
            value={t.settingsValReset}
            valueStyle={s.redValue}
            onPress={handleResetQuestionnaire}
          />
          <Divider />
          <SettingRow label={t.settingsRowCurrentPhase} value={ts.phase} />
        </View>

        <SectionHeader title={t.settingsSectionAbout} />
        <View style={s.card}>
          <SettingRow label={t.settingsRowVersion} value="1.0.0" />
          <Divider />
          <SettingRow label={t.settingsRowCreator} value="VerMillion" />
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>{t.settingsLogout}</Text>
        </TouchableOpacity>

        <Text style={s.footer}>{t.settingsPricing}</Text>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1E1E1E',
  },
  backBtn: { marginRight: 12, padding: 4 },
  backArrow: { color: '#C0392B', fontSize: 30, lineHeight: 30 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'right', flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 4 },
  sectionHeader: {
    color: '#444444', fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    textAlign: 'right', marginTop: 28, marginBottom: 8, textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#1A1A1A', borderRadius: 16,
    borderWidth: 1, borderColor: '#1E1E1E', overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: '#222222', marginHorizontal: 16 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 48,
  },
  rowLabel: { color: '#FFFFFF', fontSize: 15, textAlign: 'right' },
  rowValue: { color: '#888888', fontSize: 14, textAlign: 'left' },
  redValue: { color: '#C0392B' },
  mutedValue: { color: '#555555' },
  logoutBtn: {
    marginTop: 32, borderWidth: 1, borderColor: '#C0392B33',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    minHeight: 48, justifyContent: 'center',
  },
  logoutText: { color: '#C0392B', fontSize: 16, fontWeight: '600' },
  footer: { color: '#444444', fontSize: 12, textAlign: 'center', marginTop: 24 },
});
