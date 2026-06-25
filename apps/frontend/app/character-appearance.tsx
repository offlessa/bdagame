import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, ImageBackground, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore, CharacterLook, DEFAULT_LOOK } from '../src/store/characterStore';
import { GRAFFITI } from '../src/theme/fonts';
import CharacterLayered, { hairFilter } from '../src/components/CharacterLayered';

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
  { id: 'cabelo',      label: 'CABELO',      emoji: '💈', desc: 'Estilo',   options: ['0', '1'] },
  { id: 'olhos',       label: 'OLHOS',       emoji: '👁',  desc: 'Olhar',   options: ['1','2','3','4','5'] },
  { id: 'sobrancelha', label: 'SOBRANCELHA', emoji: '🤨', desc: 'Atitude', options: ['1'] },
  { id: 'nariz',       label: 'NARIZ',       emoji: '👃', desc: 'Forma',   options: ['1','2','3','4','5'] },
  { id: 'boca',        label: 'BOCA',        emoji: '🎤', desc: 'Flow',    options: ['1','2','3','4','5'] },
  { id: 'roupa_top',   label: 'JAQUETA',     emoji: '🧥', desc: 'Drip',   options: ['0', '1'] },
  { id: 'roupa_calca', label: 'CALÇA',       emoji: '👖', desc: 'Estilo', options: ['0', '1'] },
  { id: 'calcado',     label: 'TÊNIS',       emoji: '👟', desc: 'Swag',   options: ['0', '1'] },
  { id: 'mic',         label: 'MICROFONE',   emoji: '🎤', desc: 'Flow',   options: ['1', '2'] },
];

/* ─── Layer preview helpers ─── */

const CANVAS_W = 2646;
const CANVAS_H = 1701;

// Approximate crop regions [x, y, w, h] in canvas space for each category
const CAT_CROP: Partial<Record<Category, [number, number, number, number]>> = {
  cabelo:      [1050,  50, 600, 420],
  sobrancelha: [1080, 100, 540, 180],
  olhos:       [1080, 130, 540, 200],
  nariz:       [1120, 190, 460, 230],
  boca:        [1100, 270, 500, 240],
  roupa_top:   [ 940, 280, 870, 760],
  roupa_calca: [ 980, 720, 820, 840],
  calcado:     [ 950,1200, 860, 380],
  mic:         [ 840, 230, 590, 470],
};

// Moved here so LayerPreview and HueSlider both can access it
const HAIR_PRESETS = [
  { value: '',      bg: '#111111', label: 'PRETO'    },
  { value: 'white', bg: '#E8E8E8', label: 'BRANCO'   },
  { value: '0',     bg: '#FF1A00', label: 'VERMELHO' },
  { value: '38',    bg: '#FF6600', label: 'LARANJA'  },
  { value: 'yellow', bg: '#FFD700', label: 'AMARELO' },
  { value: '120',   bg: '#00CC44', label: 'VERDE'    },
  { value: '210',   bg: '#1E90FF', label: 'AZUL'     },
  { value: '270',   bg: '#9900FF', label: 'ROXO'     },
  { value: '320',   bg: '#FF1493', label: 'ROSA'     },
];

// Maps each item category to its corresponding color field in CharacterLook
const CAT_COLOR_FIELD: Partial<Record<Category, keyof CharacterLook>> = {
  cabelo:      'cor_cabelo',
  sobrancelha: 'cor_sobrancelha',
  olhos:       'cor_olhos',
  nariz:       'cor_nariz',
  boca:        'cor_boca',
  roupa_top:   'cor_roupa_top',
  roupa_calca: 'cor_roupa_calca',
  calcado:     'cor_calcado',
  mic:         'cor_mic',
};

function getLayerUrl(catId: Category, value: string): string | null {
  if (!value || value === '0') return null;
  switch (catId) {
    case 'cabelo':      return `/partes-personagem/cabelos/${value}.png`;
    case 'sobrancelha': return `/partes-personagem/sobrancelhas/${value}.png`;
    case 'olhos':       return `/partes-personagem/Olhos/${value}.png`;
    case 'nariz':       return `/partes-personagem/Narizes/${value}.png`;
    case 'boca':        return `/partes-personagem/Bocas/${value}.png`;
    case 'roupa_top':   return `/partes-personagem/roupas/top${value}.png`;
    case 'roupa_calca': return `/partes-personagem/roupas/calca${value}.png`;
    case 'calcado':     return `/partes-personagem/acessorios/tenis${value}.png`;
    case 'mic':         return value === '1'
      ? `/partes-personagem/acessorios/braco_mic.png`
      : `/partes-personagem/acessorios/mic_gold.png`;
    default:            return null;
  }
}

// Renders a cropped PNG layer preview — or 🚫 for none
function LayerPreview({ catId, value, size, flt }: {
  catId: Category; value: string; size: number; flt?: string;
}) {
  if (value === '0') {
    return <Text style={{ fontSize: size * 0.5, lineHeight: size, textAlign: 'center' }}>🚫</Text>;
  }

  const url = getLayerUrl(catId, value);
  if (!url) return <Text style={{ fontSize: size * 0.4, lineHeight: size, color: '#555', textAlign: 'center' }}>—</Text>;

  const crop = CAT_CROP[catId];
  if (Platform.OS === 'web' && crop) {
    const [cx, cy, cw, ch] = crop;
    const scale = size / Math.max(cw, ch);
    const scaledW = Math.round(CANVAS_W * scale);
    const scaledH = Math.round(CANVAS_H * scale);
    const Div = 'div' as any;
    const Img = 'img' as any;
    return (
      <Div style={{ width: size, height: size, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
        <Img src={url} style={{
          position: 'absolute',
          top: -Math.round(cy * scale),
          left: -Math.round(cx * scale),
          width: scaledW,
          height: scaledH,
          ...(flt ? { filter: flt } : {}),
        }} />
      </Div>
    );
  }

  return <Image source={{ uri: url }} style={{ width: size, height: size }} resizeMode="contain" />;
}

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
  const [saved, setSaved]       = useState(false);

  const activeCat = CATEGORIES.find(c => c.id === category)!;

  function select(value: string) {
    setLook(prev => ({ ...prev, [category]: value }));
  }

  async function handleSave() {
    await updateLook(look, userId!);
    savedLook.current = look;
    setSaved(true);
  }

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => router.replace('/menu'), 1200);
    return () => clearTimeout(t);
  }, [saved]);

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
                <View style={s.tabEmoji}>
                  <LayerPreview
                    catId={cat.id}
                    value={look[cat.id] as string}
                    size={28}
                    flt={(() => { const cf = CAT_COLOR_FIELD[cat.id]; return cf ? hairFilter(look[cf] as string) : ''; })()}
                  />
                </View>
                <Text style={[s.tabLabel, active && { color: '#0A0A0A' }]}>{cat.label}</Text>
                <Text style={[s.tabDesc,  active && { color: '#0A0A0A80' }]}>{cat.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Item options grid */}
        {(() => {
          const colorField = CAT_COLOR_FIELD[category];
          const currentColor = colorField ? (look[colorField] as string) : '';
          const currentFlt = hairFilter(currentColor);
          return (
            <>
              <View style={s.grid}>
                {(activeCat.options ?? []).map((id) => {
                  const sel = id === currentValue;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[s.optCard, sel && { borderColor: accent, backgroundColor: accent + '12' }]}
                      onPress={() => select(id)}
                      activeOpacity={0.75}
                    >
                      {sel && (
                        <View style={[s.selBadge, { backgroundColor: accent }]}>
                          <Ionicons name="checkmark" size={10} color="#000" />
                        </View>
                      )}
                      <View style={[s.optStage, sel && { borderBottomColor: accent + '40' }]}>
                        <LayerPreview catId={activeCat.id} value={id} size={70} flt={id !== '0' ? currentFlt : ''} />
                      </View>
                      <Text style={[s.optNum, sel && { color: accent }]}>
                        {id === '0' ? 'SEM' : id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Inline color palette — shown when item is equipped */}
              {currentValue !== '0' && colorField && (
                <View style={s.colorSection}>
                  <View style={s.colorSectionHead}>
                    <View style={s.colorSectionLine} />
                    <Text style={[s.colorSectionLabel, { color: accent }]}>COR</Text>
                    <View style={s.colorSectionLine} />
                  </View>
                  <HueSlider
                    value={currentColor}
                    accent={accent}
                    onChange={v => setLook(prev => ({ ...prev, [colorField]: v }))}
                  />
                </View>
              )}
            </>
          );
        })()}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Save button fixed at bottom */}
      <TouchableOpacity style={[s.saveBar, { backgroundColor: accent }]} onPress={handleSave} activeOpacity={0.85}>
        <View style={s.saveBarShine} />
        <Ionicons name="checkmark-circle" size={22} color="#0A0A0A" />
        <Text style={s.saveBarTxt}>SALVAR PERSONAGEM</Text>
      </TouchableOpacity>
      {/* Toast de sucesso */}
      {saved && (
        <View style={s.toast}>
          <Text style={s.toastTxt}>✓ PERSONAGEM SALVO!</Text>
        </View>
      )}
    </ImageBackground>
  );
}

/* ── Hue Slider ── */
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

  tabsScroll: { width: '100%', marginBottom: 14 },
  tabsRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 2 },
  tab: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(8,8,8,0.7)', gap: 4,
    minWidth: 72,
  },
  tabEmoji: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: GRAFFITI, color: '#888', fontSize: 10, letterSpacing: 1 },
  tabDesc:  { color: '#3A3A3A', fontSize: 8, letterSpacing: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%', justifyContent: 'center' },
  optCard: {
    width: '30%', minWidth: 95,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(8,8,8,0.80)',
    alignItems: 'center', paddingBottom: 12,
    overflow: 'hidden', position: 'relative',
  },
  optStage: {
    width: '100%', height: 86,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  selBadge: {
    position: 'absolute', top: 7, right: 7,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  optNum: { fontFamily: GRAFFITI, color: '#555', fontSize: 14, letterSpacing: 2 },

  colorSection: { width: '100%', marginTop: 20, paddingTop: 4 },
  colorSectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  colorSectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  colorSectionLabel: { fontFamily: GRAFFITI, fontSize: 13, letterSpacing: 5 },

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

  toast: {
    position: 'absolute', bottom: 100, alignSelf: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 30,
    paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 1.5, borderColor: GOLD,
  },
  toastTxt: { fontFamily: GRAFFITI, color: GOLD, fontSize: 16, letterSpacing: 3 },
});
