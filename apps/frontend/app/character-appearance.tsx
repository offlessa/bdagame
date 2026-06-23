import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore, CharacterLook, DEFAULT_LOOK } from '../src/store/characterStore';
import { Colors } from '../src/theme/colors';
import { GRAFFITI } from '../src/theme/fonts';
import CharacterLayered from '../src/components/CharacterLayered';

const OPTIONS_5 = ['1', '2', '3', '4', '5'];
type Category = 'olhos' | 'nariz' | 'boca';

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: 'olhos', label: 'OLHOS', emoji: '👁' },
  { id: 'nariz', label: 'NARIZ', emoji: '👃' },
  { id: 'boca',  label: 'BOCA',  emoji: '🎤' },
];

export default function CharacterAppearanceScreen() {
  const { userId } = useAuthStore();
  const { character, updateLook } = useCharacterStore();

  const initialLook: CharacterLook =
    character?.look && 'olhos' in character.look
      ? (character.look as CharacterLook)
      : DEFAULT_LOOK;

  const [look, setLook] = useState<CharacterLook>(initialLook);
  const [category, setCategory] = useState<Category>('olhos');

  function select(value: string) {
    setLook(prev => ({ ...prev, [category]: value }));
  }

  async function handleSave() {
    await updateLook(look, userId!);
    router.back();
  }

  const accent = character?.archetypeColor ?? Colors.primary;
  const currentValue = look[category];

  return (
    <View style={s.bg}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerSub}>RAP BATTLE</Text>
          <Text style={s.headerTitle}>CRIADOR DE MC</Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={[s.saveBtn, { backgroundColor: accent }]}>
          <Text style={s.saveBtnTxt}>SALVAR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Preview */}
        <View style={[s.previewCard, { borderColor: accent + '50' }]}>
          <View style={[s.halo, { backgroundColor: accent }]} />

          <Text style={[s.cornerStar, { top: 10, left: 14, color: accent + '50' }]}>✦</Text>
          <Text style={[s.cornerStar, { top: 10, right: 14, color: accent + '50' }]}>✦</Text>

          <View style={[s.mcBadge, { backgroundColor: accent }]}>
            <Text style={s.mcBadgeTxt}>SEU MC</Text>
          </View>

          <CharacterLayered look={look} size={340} />

          <View style={s.nameStrip}>
            <Text style={s.mcName}>{character?.battleName ?? 'SEU MC'}</Text>
            <View style={[s.archBadge, { borderColor: accent }]}>
              <Text style={[s.archTxt, { color: accent }]}>
                {character?.archetypeIcon ?? '🎤'} {character?.archetype ?? 'MC'}
              </Text>
            </View>
          </View>

          <View style={[s.accentBar, { backgroundColor: accent }]} />
        </View>

        {/* Divider */}
        <View style={s.divider}>
          <View style={s.divLine} />
          <Text style={[s.divTxt, { color: accent + '80' }]}>CUSTOMIZE</Text>
          <View style={s.divLine} />
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {CATEGORIES.map(cat => {
            const active = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[s.tab, active && { backgroundColor: accent, borderColor: accent }]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Text style={s.tabEmoji}>{cat.emoji}</Text>
                <Text style={[s.tabLabel, active && { color: Colors.bg }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Options */}
        <View style={s.grid}>
          {OPTIONS_5.map(id => {
            const sel = id === currentValue;
            return (
              <TouchableOpacity
                key={id}
                style={[s.optCard, { borderColor: sel ? accent : Colors.border }, sel && { backgroundColor: accent + '12' }]}
                onPress={() => select(id)}
                activeOpacity={0.7}
              >
                {sel && (
                  <View style={[s.crown, { backgroundColor: accent }]}>
                    <Text style={s.crownTxt}>👑</Text>
                  </View>
                )}
                <View style={s.thumbBox}>
                  <Text style={[s.thumbNum, { color: sel ? accent : Colors.muted }]}>{id}</Text>
                </View>
                <Text style={[s.optLabel, sel && { color: accent }]}>OPÇÃO {id}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.bg },

  header: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSub: { fontFamily: GRAFFITI, color: Colors.muted, fontSize: 14, letterSpacing: 5 },
  headerTitle: { fontFamily: GRAFFITI, color: Colors.white, fontSize: 20, letterSpacing: 4 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 3 },
  saveBtnTxt: { fontFamily: GRAFFITI, color: Colors.bg, fontSize: 18, letterSpacing: 3 },

  scroll: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 20 },

  previewCard: {
    width: 340, borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: Colors.card,
    alignItems: 'center',
    paddingTop: 14, paddingBottom: 0,
    overflow: 'hidden', position: 'relative', marginBottom: 8,
  },
  halo: {
    position: 'absolute', top: 20, left: 30, right: 30, bottom: 20,
    borderRadius: 24, opacity: 0.10,
  },
  cornerStar: { position: 'absolute', fontSize: 14 },
  mcBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginBottom: 6 },
  mcBadgeTxt: { fontFamily: GRAFFITI, color: Colors.bg, fontSize: 14, letterSpacing: 4 },
  nameStrip: { width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 14, backgroundColor: Colors.card },
  mcName: { fontFamily: GRAFFITI, color: Colors.white, fontSize: 26, letterSpacing: 3, textTransform: 'uppercase' },
  archBadge: { marginTop: 4, borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3 },
  archTxt: { fontFamily: GRAFFITI, fontSize: 16, letterSpacing: 4 },
  accentBar: { width: '80%', height: 3, borderRadius: 2 },

  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divTxt: { fontFamily: GRAFFITI, fontSize: 14, letterSpacing: 5, marginHorizontal: 10 },

  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20, width: '100%' },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10, borderRadius: 4,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tabEmoji: { fontSize: 16 },
  tabLabel: { fontFamily: GRAFFITI, color: Colors.muted, fontSize: 16, letterSpacing: 3 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', justifyContent: 'center' },
  optCard: {
    width: 95, borderRadius: 6,
    borderWidth: 2,
    backgroundColor: Colors.card,
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8,
    overflow: 'visible', position: 'relative',
  },
  crown: {
    position: 'absolute', top: -10, right: -6,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  crownTxt: { fontSize: 12 },
  thumbBox: {
    width: 64, height: 64, borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  thumbNum: { fontSize: 22, fontWeight: '900' },
  optLabel: { fontFamily: GRAFFITI, color: Colors.muted, fontSize: 14, letterSpacing: 2, textAlign: 'center', paddingTop: 2 },
});
