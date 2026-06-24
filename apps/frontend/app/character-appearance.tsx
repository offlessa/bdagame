import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ImageBackground, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore, CharacterLook, DEFAULT_LOOK } from '../src/store/characterStore';
import { GRAFFITI } from '../src/theme/fonts';
import CharacterLayered from '../src/components/CharacterLayered';

const GOLD   = '#FFAA00';
const PURPLE = '#9D00FF';
const BG = Platform.OS === 'web' ? { uri: '/bg-wall.png' } : require('../public/bg-wall.png');

const OPTIONS_5 = ['1', '2', '3', '4', '5'];
type Category = 'olhos' | 'nariz' | 'boca';

const CATEGORIES: { id: Category; label: string; emoji: string; desc: string }[] = [
  { id: 'olhos', label: 'OLHOS',  emoji: '👁',  desc: 'Expressão' },
  { id: 'nariz', label: 'NARIZ',  emoji: '👃',  desc: 'Forma' },
  { id: 'boca',  label: 'BOCA',   emoji: '🎤',  desc: 'Estilo' },
];

const OPTION_ICONS: Record<Category, string[]> = {
  olhos: ['😐', '😌', '😤', '😎', '😈'],
  nariz: ['🔹', '🔸', '◾', '▫️', '🔺'],
  boca:  ['😶', '😏', '😬', '😤', '😆'],
};

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

  const accent       = character?.archetypeColor ?? GOLD;
  const currentValue = look[category];

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      <View style={s.overlay} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={20} color={GOLD} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.title}>PERSONAGEM</Text>
          <Text style={s.sub}>CRIADOR DE MC</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Preview */}
        <View style={[s.previewCard, { borderColor: accent + '40' }]}>
          {/* Glow */}
          <View style={[s.glow, { backgroundColor: accent }]} />
          <View style={[s.glowInner, { backgroundColor: accent }]} />

          {/* Decorações */}
          <Text style={[s.deco, { top: 12, left: 18, color: accent + '60' }]}>✦</Text>
          <Text style={[s.deco, { top: 12, right: 18, color: accent + '60' }]}>✦</Text>

          {/* Badge MC */}
          <View style={[s.mcBadge, { backgroundColor: accent }]}>
            <Text style={s.mcBadgeTxt}>👑 SEU MC</Text>
          </View>

          <CharacterLayered look={look} size={300} />

          {/* Nome + arquétipo */}
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
          <Text style={[s.divTxt, { color: accent + '90' }]}>CUSTOMIZE</Text>
          <View style={s.divLine} />
        </View>

        {/* Tabs de categoria */}
        <View style={s.tabs}>
          {CATEGORIES.map(cat => {
            const active = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  s.tab,
                  active && { backgroundColor: accent, borderColor: accent },
                ]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Text style={s.tabEmoji}>{cat.emoji}</Text>
                <Text style={[s.tabLabel, active && { color: '#0A0A0A' }]}>{cat.label}</Text>
                <Text style={[s.tabDesc, active && { color: '#0A0A0A80' }]}>{cat.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Grid de opções */}
        <View style={s.grid}>
          {OPTIONS_5.map((id, i) => {
            const sel = id === currentValue;
            return (
              <TouchableOpacity
                key={id}
                style={[
                  s.optCard,
                  { borderColor: sel ? accent : 'rgba(255,255,255,0.06)' },
                  sel && { backgroundColor: accent + '18' },
                ]}
                onPress={() => select(id)}
                activeOpacity={0.7}
              >
                {sel && (
                  <View style={[s.selBadge, { backgroundColor: accent }]}>
                    <Ionicons name="checkmark" size={11} color="#000" />
                  </View>
                )}
                <Text style={s.optEmoji}>{OPTION_ICONS[category][i]}</Text>
                <Text style={[s.optNum, { color: sel ? accent : '#333' }]}>{id}</Text>
                <Text style={[s.optLbl, sel && { color: accent }]}>OPÇÃO {id}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Botão SALVAR fixo na base */}
      <TouchableOpacity style={[s.saveBar, { backgroundColor: accent }]} onPress={handleSave} activeOpacity={0.85}>
        <View style={s.saveBarShine} />
        <Ionicons name="checkmark-circle" size={22} color="#0A0A0A" />
        <Text style={s.saveBarTxt}>SALVAR PERSONAGEM</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060606' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.60)' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,170,0,0.15)',
  },
  back: { padding: 6 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontFamily: GRAFFITI, color: GOLD, fontSize: 26, letterSpacing: 6 },
  sub:   { fontFamily: GRAFFITI, color: '#555', fontSize: 11, letterSpacing: 3, marginTop: -2 },

  scroll: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 16, paddingBottom: 20 },

  // Preview card
  previewCard: {
    width: '100%', borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'rgba(10,10,10,0.75)',
    alignItems: 'center',
    paddingTop: 14, paddingBottom: 0,
    overflow: 'hidden', position: 'relative', marginBottom: 6,
  },
  glow: {
    position: 'absolute', top: 10, left: 40, right: 40, height: 200,
    borderRadius: 30, opacity: 0.10,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(40px)' } as any) : {}),
  },
  glowInner: {
    position: 'absolute', top: 40, left: 80, right: 80, height: 120,
    borderRadius: 20, opacity: 0.12,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(20px)' } as any) : {}),
  },
  deco: { position: 'absolute', fontSize: 14 },
  mcBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  mcBadgeTxt: { fontFamily: GRAFFITI, color: '#0A0A0A', fontSize: 14, letterSpacing: 4 },
  nameStrip: {
    width: '100%', alignItems: 'center',
    paddingTop: 12, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    gap: 6,
  },
  mcName:   { fontFamily: GRAFFITI, color: '#FFF', fontSize: 24, letterSpacing: 3 },
  archBadge:{ borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3 },
  archTxt:  { fontFamily: GRAFFITI, fontSize: 14, letterSpacing: 2 },
  accentBar:{ width: '80%', height: 3, borderRadius: 2 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 18 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  divTxt:  { fontFamily: GRAFFITI, fontSize: 13, letterSpacing: 5, marginHorizontal: 12 },

  // Tabs
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 18, width: '100%' },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 2,
  },
  tabEmoji: { fontSize: 20 },
  tabLabel: { fontFamily: GRAFFITI, color: '#888', fontSize: 14, letterSpacing: 2 },
  tabDesc:  { color: '#444', fontSize: 9, letterSpacing: 1 },

  // Grid de opções
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', justifyContent: 'center' },
  optCard: {
    width: '18%', minWidth: 60,
    borderRadius: 8, borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', paddingVertical: 14,
    overflow: 'visible', position: 'relative',
  },
  selBadge: {
    position: 'absolute', top: -8, right: -6,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  optEmoji: { fontSize: 26, marginBottom: 4 },
  optNum:   { fontFamily: GRAFFITI, fontSize: 22 },
  optLbl:   { fontFamily: GRAFFITI, color: '#444', fontSize: 9, letterSpacing: 1, marginTop: 2 },

  // Save bar
  saveBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
    paddingBottom: Platform.OS === 'ios' ? 34 : 18,
    overflow: 'hidden', position: 'relative',
  },
  saveBarShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  saveBarTxt: { fontFamily: GRAFFITI, color: '#0A0A0A', fontSize: 20, letterSpacing: 4 },
});
