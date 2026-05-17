import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { REGULATIONS_VERSION, REGULATION_SECTIONS } from '../../constants/regulationsHe';
import { SERVICE_SECTIONS } from '../../constants/serviceDescriptionHe';

function SectionBlock({ section, onLayout }) {
  return (
    <View style={r.section} onLayout={onLayout}>
      {section.icon ? (
        <Text style={r.sectionIcon}>{section.icon}</Text>
      ) : null}
      <Text style={r.sectionTitle}>{section.title}</Text>
      {section.subtitle ? (
        <Text style={r.sectionSub}>{section.subtitle}</Text>
      ) : null}
      {section.body?.map((para, i) => (
        <Text key={i} style={r.para}>{para}</Text>
      ))}
      {section.items?.map((item, i) => (
        <View key={i} style={r.itemRow}>
          <Text style={r.itemTitle}>{item.title}</Text>
          <Text style={r.itemDesc}>{item.desc}</Text>
        </View>
      ))}
    </View>
  );
}

export default function RegulationsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const sectionOffsets = useRef({});
  const focusId = route?.params?.sectionId;
  const [tab, setTab] = useState(route?.params?.tab || 'regulations');

  const sections = tab === 'regulations' ? REGULATION_SECTIONS : SERVICE_SECTIONS;

  const jumpTo = (id) => {
    const y = sectionOffsets.current[id];
    if (y != null && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }
  };

  const switchTab = (t) => {
    sectionOffsets.current = {};
    setTab(t);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={[r.container, { paddingTop: insets.top }]}>
      <View style={r.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={r.backBtn}>
          <Text style={r.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={r.title}>תקנון ומידע</Text>
      </View>

      {/* Tabs */}
      <View style={r.tabs}>
        <TouchableOpacity
          style={[r.tabBtn, tab === 'regulations' && r.tabBtnActive]}
          onPress={() => switchTab('regulations')}
          activeOpacity={0.8}
        >
          <Text style={[r.tabText, tab === 'regulations' && r.tabTextActive]}>תקנון</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[r.tabBtn, tab === 'service' && r.tabBtnActive]}
          onPress={() => switchTab('service')}
          activeOpacity={0.8}
        >
          <Text style={[r.tabText, tab === 'service' && r.tabTextActive]}>על השירות</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        key={tab}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[r.scroll, { paddingBottom: insets.bottom + 40 }]}
        onContentSizeChange={() => {
          if (focusId && tab === 'regulations') setTimeout(() => jumpTo(focusId), 100);
        }}
      >
        {tab === 'regulations' ? (
          <>
            <Text style={r.version}>גרסת תקנון: {REGULATIONS_VERSION}</Text>
            <Text style={r.intro}>
              תקנון זה מסדיר את השימוש בשירות VerMillion, תנאי המנוי, מנגנון קופת הפרסים,
              חוזי הזמן (DNA), ומנגנון האימות. קריאת התקנון מהווה הסכמה לתנאיו.
            </Text>

            <View style={r.toc}>
              <Text style={r.tocTitle}>תוכן עניינים</Text>
              {REGULATION_SECTIONS.map((sec) => (
                <TouchableOpacity
                  key={sec.id}
                  style={r.tocRow}
                  onPress={() => jumpTo(sec.id)}
                  activeOpacity={0.7}
                >
                  <Text style={r.tocArrow}>‹</Text>
                  <Text style={r.tocLabel}>{sec.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <Text style={r.intro}>
            מה VerMillion, מה מקבלים במנוי, ומה היועץ AI יכול ולא יכול לעשות.
          </Text>
        )}

        {sections.map((sec) => (
          <SectionBlock
            key={sec.id}
            section={sec}
            onLayout={(e) => {
              sectionOffsets.current[sec.id] = e.nativeEvent.layout.y;
            }}
          />
        ))}

        <Text style={r.legalNote}>
          {tab === 'regulations'
            ? `גרסה ${REGULATIONS_VERSION} · VerMillion אינה נותנת ייעוץ פיננסי מורשה.`
            : 'VerMillion היא שירות אימון בלבד · אינה מחזיקה רישיון ייעוץ השקעות.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const r = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0A0A0A' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  backBtn:        { marginRight: 12, padding: 4 },
  backArrow:      { color: '#C0392B', fontSize: 30, lineHeight: 30 },
  title:          { color: '#FFF', fontSize: 20, fontWeight: '700', textAlign: 'right', flex: 1 },

  tabs:           { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  tabBtn:         { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive:   { borderBottomWidth: 2, borderBottomColor: '#C0392B' },
  tabText:        { color: '#555', fontSize: 14, fontWeight: '700' },
  tabTextActive:  { color: '#FFF' },

  scroll:         { paddingHorizontal: 20, paddingTop: 16 },
  version:        { color: '#555', fontSize: 11, textAlign: 'right', marginBottom: 8 },
  intro:          { color: '#AAA', fontSize: 14, lineHeight: 22, textAlign: 'right', marginBottom: 20 },

  toc:            { backgroundColor: '#1A1A1A', borderRadius: 14, borderWidth: 1, borderColor: '#222', padding: 14, marginBottom: 24 },
  tocTitle:       { color: '#D4AF37', fontSize: 12, fontWeight: '800', letterSpacing: 1, textAlign: 'right', marginBottom: 10 },
  tocRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  tocLabel:       { color: '#FFF', fontSize: 14, textAlign: 'right', flex: 1 },
  tocArrow:       { color: '#C0392B', fontSize: 18, marginLeft: 8 },

  section:        { marginBottom: 28 },
  sectionIcon:    { fontSize: 24, textAlign: 'right', marginBottom: 4 },
  sectionTitle:   { color: '#FFF', fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: 4 },
  sectionSub:     { color: '#D4AF37', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 12 },
  para:           { color: '#BBB', fontSize: 14, lineHeight: 24, textAlign: 'right', marginBottom: 10 },

  itemRow:        { backgroundColor: '#111', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1E1E1E' },
  itemTitle:      { color: '#FFF', fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  itemDesc:       { color: '#888', fontSize: 13, lineHeight: 20, textAlign: 'right' },

  legalNote:      { color: '#444', fontSize: 11, lineHeight: 18, textAlign: 'right', marginTop: 8, fontStyle: 'italic' },
});
