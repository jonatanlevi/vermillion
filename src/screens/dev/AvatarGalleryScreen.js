import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar3D from '../../components/Avatar3D';
import { ARCHETYPE_LIST } from '../../utils/archetypeEngine';

const DEMO_SEED = 'vermillion-gallery';

export default function AvatarGalleryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>כל דמויות הארכיטיפ</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {!isWeb ? (
          <Text style={s.nativeHint}>
            דמויות הגוף המלא (לוחם, חכם, מלך, כורש, בונה) מוצגות בגרסת Web. בנייטיב
            האווטאר נטען מ־Dicebear.
          </Text>
        ) : null}

        {ARCHETYPE_LIST.map((a) => (
          <View key={a.id} style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.emoji}>{a.emoji}</Text>
              <View style={s.cardTitles}>
                <Text style={s.heName}>{a.hebrewName}</Text>
                <Text style={s.enName}>{a.name}</Text>
              </View>
            </View>
            <View style={s.avatarWrap}>
              {isWeb ? (
                <Avatar3D
                  archetype={a.id}
                  seed={DEMO_SEED}
                  size={130}
                  showGlow
                  accentColor={a.color}
                />
              ) : (
                <Avatar3D seed={`${a.id}-${DEMO_SEED}`} size={96} showGlow accentColor={a.color} />
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
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
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  nativeHint: {
    color: '#888',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#252525',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 8,
  },
  emoji: { fontSize: 28, marginLeft: 12 },
  cardTitles: { flex: 1, alignItems: 'flex-end' },
  heName: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  enName: { color: '#666', fontSize: 12, fontWeight: '600', marginTop: 2 },
  avatarWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
});
