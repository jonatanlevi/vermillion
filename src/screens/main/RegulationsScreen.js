import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { REGULATIONS_VERSION, REGULATION_SECTIONS } from '../../constants/regulationsHe';

function SectionBlock({ section, onLayout }) {
  return (
    <View style={r.section} onLayout={onLayout}>
      <Text style={r.sectionTitle}>{section.title}</Text>
      {section.subtitle ? (
        <Text style={r.sectionSub}>{section.subtitle}</Text>
      ) : null}
      {section.body.map((para, i) => (
        <Text key={i} style={r.para}>{para}</Text>
      ))}
    </View>
  );
}

export default function RegulationsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const sectionOffsets = useRef({});
  const focusId = route?.params?.sectionId;

  const jumpTo = (id) => {
    const y = sectionOffsets.current[id];
    if (y != null && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }
  };

  return (
    <View style={[r.container, { paddingTop: insets.top }]}>
      <View style={r.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={r.backBtn}>
          <Text style={r.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={r.title}>תקנון וחוזים</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[r.scroll, { paddingBottom: insets.bottom + 40 }]}
        onContentSizeChange={() => {
          if (focusId) setTimeout(() => jumpTo(focusId), 100);
        }}
      >
        <Text style={r.version}>גרסת תקנון: {REGULATIONS_VERSION}</Text>
        <Text style={r.intro}>
          מסמך זה מסכם את חוזי הזמן, האתגרים בשישי ושבת, וכללי האימות במשחק.
          השעות מוצגות באפליקציה לפי היום המקומי על המכשיר שלך.
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

        {REGULATION_SECTIONS.map((sec) => (
          <SectionBlock
            key={sec.id}
            section={sec}
            onLayout={(e) => {
              sectionOffsets.current[sec.id] = e.nativeEvent.layout.y;
            }}
          />
        ))}

        <Text style={r.legalNote}>
          לעיון משפטי מלא: המערכת פועלת לפי חוזי זמן ואימות המתוארים לעיל.
          שינוי חלונות או כללי DNA דורש עדכון תקנון.
        </Text>
      </ScrollView>
    </View>
  );
}

const r = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  backBtn: { marginRight: 12, padding: 4 },
  backArrow: { color: '#C0392B', fontSize: 30, lineHeight: 30 },
  title: { color: '#FFF', fontSize: 20, fontWeight: '700', textAlign: 'right', flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  version: { color: '#555', fontSize: 11, textAlign: 'right', marginBottom: 8 },
  intro: {
    color: '#AAA',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: 20,
  },
  toc: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    marginBottom: 24,
  },
  tocTitle: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'right',
    marginBottom: 10,
  },
  tocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tocLabel: { color: '#FFF', fontSize: 14, textAlign: 'right', flex: 1 },
  tocArrow: { color: '#C0392B', fontSize: 18, marginLeft: 8 },
  section: { marginBottom: 28 },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 4,
  },
  sectionSub: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 12,
  },
  para: {
    color: '#BBB',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
    marginBottom: 10,
  },
  legalNote: {
    color: '#444',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
