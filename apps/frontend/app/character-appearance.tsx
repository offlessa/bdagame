import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ImageBackground, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore, CharacterLook, DEFAULT_LOOK } from '../src/store/characterStore';
import { GRAFFITI } from '../src/theme/fonts';
import CharacterLayered from '../src/components/CharacterLayered';

const GOLD = '#FFAA00';
const BG = Platform.OS === 'web' ? { uri: '/bg-wall.png' } : require('../public/bg-wall.png');

type Category = keyof CharacterLook;

interface CatDef {
  id: Category;
  label: string;
  emoji: string;
  desc: string;
  type?: 'hue-slider';
  options?: string[];
  icons?: string[];
}

const CATEGORIES: CatDef[] = [
  {
    id: 'cabelo', label: 'CABELO', emoji: '💈', desc: 'Estilo',
    options: ['0', '1'],
    icons: ['🚫', '💇'],
  },
  {
    id: 'cor_cabelo', label: 'COR CABELO', emoji: '🎨', desc: 'Tom',
    type: 'hue-slider',
  },
  {
    id: 'olhos', label: 'OLHOS', emoji: '👁', desc: 'Expressão',
    options: ['1', '2', '3', '4', '5'],
    icons: ['😐', '😌', '😤', '😎', '😈'],
  },
  {
    id: 'sobrancelha', label: 'SOBRANCELHA', emoji: '🤨', desc: 'Atitude',
    options: ['1'],
    icons: ['😤'],
  },
  {
    id: 'nariz', label: 'NARIZ', emoji: '👃', desc: 'Forma',
    options: ['1', '2', '3', '4', '5'],
    icons: ['🔹', '🔸', '◾', '▫️', '🔺'],
  },
  {
    id: 'boca', label: 'BOCA', emoji: '🎤', desc: 'Flow',
    options: ['1', '2', '3', '4', '5'],
    icons: ['😶', '😏', '😬', '😤', '😆'],
  },
  {
    id: 'roupa_top', label: 'JAQUETA', emoji: '🧥', desc: 'Drip',
    options: ['0', '1'],
    icons: ['🚫', '🖤'],
  },
  {
    id: 'roupa_calca', label: 'CALÇA', emoji: '👖', desc: 'Estilo',
    options: ['0', '1'],
    icons: ['🚫', '⛓'],
  },
  {
    id: 'calcado', label: 'TÊNIS', emoji: '👟', desc: 'Swag',
    options: ['0', '1'],
    icons: ['🚫', '👟'],
  },
  {
    id: 'mic', label: 'MICROFONE', emoji: '🎤', desc: 'Flow',
    options: ['1', '2'],
    icons: ['🎤', '🏆'],
  },
];

export default function CharacterAppearanceScreen() {
  const { userId } = useAuthStore();
  const { character, updateLook } = useCharacterStore();

  // Merge saved look with DEFAULT_LOOK so new fields always have a value
  const initialLook: CharacterLook = {
    ...DEFAULT_LOOK,
    ...(character?.look ?? {}),
  };

  const savedLook = useRef<CharacterLook>(initialLook);

  const [look, setLook]         = useState<CharacterLook>(initialLook);
  const [category, setCategory] = useState<Category>('cabelo');

  const activeCat = CATEGORIES.find(c => c.id === category)!;

  function select(value: string) {
    setLook(prev => ({ ...prev, [category]: value }));
  }

  async function handleSave() {
    await updateLook(look, userId!);
    router.back();
  }

  function handleBack() {
    const hasChanges = JSON.stringify(look) !== JSON.stringify(savedLook.current);
    if (!hasChanges) { router.back(); return; }
    if (Platform.OS === 'web') {
      if (window.confirm('Descartar alterações?\n\nVocê tem mudanças não salvas. Deseja sair sem salvar?')) {
        router.back();
      }
    } else {
      Alert.alert(
        'Descartar alterações?',
        'Você tem mudanças não salvas. Deseja sair sem salvar?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
        ],
      );
    }
  }

  const accent       = character?.archetypeColor ?? GOLD;
  const currentValue = look[category] as string;

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      <View style={s.overlay} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.back}>
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
          <View style={[s.glow, { backgroundColor: accent }]} />
          <View style={[s.glowInner, { backgroundColor: accent }]} />
          <Text style={[s.deco, { top: 12, left: 18, color: accent + '60' }]}>✦</Text>
          <Text style={[s.deco, { top: 12, right: 18, color: accent + '60' }]}>✦</Text>

          <View style={[s.mcBadge, { backgroundColor: accent }]}>
            <Text style={s.mcBadgeTxt}>👑 SEU MC</Text>
          </View>

          <CharacterLayered look={look} size={180} />

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

        {/* Category tabs — horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsRow}
          style={s.tabsScroll}
        >
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
                <Text style={[s.tabLabel, active && { color: '#0A0A0A' }]}>{cat.label}</Text>
                <Text style={[s.tabDesc,  active && { color: '#0A0A0A80' }]}>{cat.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Options — grid or hue slider depending on category type */}
        {activeCat.type === 'hue-slider' ? (
          <HueSlider value={currentValue} accent={accent} onChange={select} />
        ) : (
          <View style={s.grid}>
            {(activeCat.options ?? []).map((id, i) => {
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
                  <Text style={s.optEmoji}>{(activeCat.icons ?? [])[i]}</Text>
                  <Text style={[s.optNum, { color: sel ? accent : '#333' }]}>{id}</Text>
                  <Text style={[s.optLbl, sel && { color: accent }]}>OPÇÃO {id}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Save button fixed at bottom */}
      <TouchableOpacity style={[s.saveBar, { backgroundColor: accent }]} onPress={handleSave} activeOpacity={0.85}>
        <View style={s.saveBarShine} />
        <Ionicons name="checkmark-circle" size={22} color="#0A0A0A" />
        <Text style={s.saveBarTxt}>SALVAR PERSONAGEM</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

/* ── Hue Slider ── */
const HAIR_PRESETS = [
  { value: '',      bg: '#111111', label: 'PRETO'    },
  { value: 'white', bg: '#E8E8E8', label: 'BRANCO'   },
  { value: '0',     bg: '#FF1A00', label: 'VERMELHO' },
  { value: '38',    bg: '#FF6600', label: 'LARANJA'  },
  { value: 'yellow', bg: '#FFD700', label: 'AMARELO'  },
  { value: '120',   bg: '#00CC44', label: 'VERDE'    },
  { value: '210',   bg: '#1E90FF', label: 'AZUL'     },
  { value: '270',   bg: '#9900FF', label: 'ROXO'     },
  { value: '320',   bg: '#FF1493', label: 'ROSA'     },
];

function HueSlider({ value, accent, onChange }: {
  value: string; accent: string; onChange: (v: string) => void;
}) {
  return (
    <View style={hs.grid}>
      {HAIR_PRESETS.map(p => {
        const sel = value === p.value;
        return (
          <TouchableOpacity
            key={p.label}
            style={hs.btnWrap}
            onPress={() => onChange(p.value)}
            activeOpacity={0.75}
          >
            <View style={[
              hs.circle,
              { backgroundColor: p.bg },
              sel && { borderColor: accent, borderWidth: 3 },
            ]}>
              {sel && <View style={hs.checkDot} />}
            </View>
            <Text style={[hs.btnLabel, sel && { color: accent }]}>{p.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const hs = StyleSheet.create({
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%', paddingHorizontal: 4 },
  btnWrap:  { alignItems: 'center', gap: 5, width: 56 },
  circle:   { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  checkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.9)' },
  btnLabel: { color: '#555', fontSize: 8, fontFamily: GRAFFITI, letterSpacing: 0.5, textAlign: 'center' },
});

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060606' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.60)' },

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

  previewCard: {
    width: '100%', borderRadius: 14, borderWidth: 1.5,
    backgroundColor: 'rgba(10,10,10,0.75)',
    alignItems: 'center', paddingTop: 14, paddingBottom: 0,
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
    backgroundColor: 'rgba(0,0,0,0.4)', gap: 6,
  },
  mcName:   { fontFamily: GRAFFITI, color: '#FFF', fontSize: 24, letterSpacing: 3 },
  archBadge:{ borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3 },
  archTxt:  { fontFamily: GRAFFITI, fontSize: 14, letterSpacing: 2 },
  accentBar:{ width: '80%', height: 3, borderRadius: 2 },

  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  divTxt:  { fontFamily: GRAFFITI, fontSize: 13, letterSpacing: 5, marginHorizontal: 12 },

  tabsScroll: { width: '100%', marginBottom: 16 },
  tabsRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 2 },
  tab: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 8, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.5)', gap: 2,
    minWidth: 72,
  },
  tabEmoji: { fontSize: 18 },
  tabLabel: { fontFamily: GRAFFITI, color: '#888', fontSize: 11, letterSpacing: 1 },
  tabDesc:  { color: '#444', fontSize: 9, letterSpacing: 1 },

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
