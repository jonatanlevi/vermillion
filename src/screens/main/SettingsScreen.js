import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getAIStatus, resetConversation } from '../../services/aiService';
import { CONFIG } from '../../config';

const AI_MODEL_ROWS = [
  ['צ׳אט · ניתוב · Coach', CONFIG.AI_MODEL],
  ['Analyst', CONFIG.AI_MODEL_ANALYST],
  ['Strategist', CONFIG.AI_MODEL_STRATEGIST],
  ['Psychologist', CONFIG.AI_MODEL_PSYCHOLOGIST],
];

function SettingRow({ label, value, onPress, valueStyle }) {
  const content = (
    <View style={s.row}>
      <Text style={[s.rowValue, valueStyle]}>{value}</Text>
      <Text style={s.rowLabel}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
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
  const { profile, signOut, deleteAccount } = useAuth();
  const [aiOnline, setAiOnline] = useState(null);

  useEffect(() => {
    getAIStatus().then(setAiOnline);
  }, []);

  const aiStatusLabel =
    aiOnline === null ? '...' : aiOnline ? '● Online' : '● מצב דמו';

  const aiStatusColor =
    aiOnline === null ? '#888' : aiOnline ? '#4CAF50' : '#F39C12';

  const handleCancelSubscription = () => {
    if (Platform.OS === 'web') window.alert('ביטול מנוי יתאפשר בגרסה הבאה.');
  };

  const handleResetQuestionnaire = () => {
    if (Platform.OS === 'web') window.alert('איפוס השאלון יתאפשר בגרסה הבאה.');
  };

  const handleClearChat = () => {
    resetConversation();
    if (Platform.OS === 'web') window.alert('היסטוריית השיחה נמחקה.');
  };

  const handleLogout = () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('יציאה מהחשבון — האם אתה בטוח?')
      : true;
    if (confirmed) signOut();
  };

  const handleDeleteAccount = () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('מחיקת חשבון לצמיתות — כל הנתונים יימחקו. האם אתה בטוח?')
      : true;
    if (confirmed) deleteAccount();
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>הגדרות</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <SectionHeader title="חשבון" />
        <View style={s.card}>
          <SettingRow label="שם" value={profile?.name || '—'} />
          <Divider />
          <SettingRow label="אימייל" value={profile?.email || '—'} />
          <Divider />
          <SettingRow
            label="ביטול מנוי"
            value="ביטול"
            valueStyle={s.redValue}
            onPress={handleCancelSubscription}
          />
        </View>

        <SectionHeader title="AI" />
        <View style={s.card}>
          {AI_MODEL_ROWS.map(([label, model], i) => (
            <React.Fragment key={label}>
              {i > 0 ? <Divider /> : null}
              <SettingRow label={label} value={model} />
            </React.Fragment>
          ))}
          <Divider />
          <SettingRow
            label="מצב חיבור"
            value={aiStatusLabel}
            valueStyle={{ color: aiStatusColor }}
          />
          <Divider />
          <SettingRow
            label="נקה שיחה"
            value="נקה"
            valueStyle={s.mutedValue}
            onPress={handleClearChat}
          />
        </View>

        <SectionHeader title="אפיון" />
        <View style={s.card}>
          <SettingRow
            label="איפוס שאלון"
            value="איפוס"
            valueStyle={s.redValue}
            onPress={handleResetQuestionnaire}
          />
        </View>

        <SectionHeader title="אודות" />
        <View style={s.card}>
          <SettingRow label="גרסה" value="1.0.0" />
          <Divider />
          <SettingRow label="יוצר" value="VerMillion" />
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>יציאה מהחשבון</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={s.deleteText}>מחק חשבון לצמיתות</Text>
        </TouchableOpacity>

        <Text style={s.footer}>₪79/חודש · ₪749/שנה</Text>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  backArrow: {
    color: '#C0392B',
    fontSize: 30,
    lineHeight: 30,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 4,
  },
  sectionHeader: {
    color: '#444444',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'right',
    marginTop: 28,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#222222',
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  rowLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'right',
  },
  rowValue: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'left',
  },
  redValue: {
    color: '#C0392B',
  },
  mutedValue: {
    color: '#555555',
  },
  logoutBtn: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#C0392B33',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  logoutText: {
    color: '#C0392B',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteBtn: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  deleteText: {
    color: '#444',
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    color: '#444444',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
