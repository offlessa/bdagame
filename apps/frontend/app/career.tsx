import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ImageBackground, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCareerStore, rpForLevel } from '../src/store/careerStore';
import { useCharacterStore, DEFAULT_LOOK } from '../src/store/characterStore';
import { Colors } from '../src/theme/colors';
import { GRAFFITI } from '../src/theme/fonts';
import { AttributeKey } from '../src/types/game';
import CharacterLayered from '../src/components/CharacterLayered';

const GOLD   = '#FFAA00';
const PURPLE = '#9D00FF';
const BG = Platform.OS === 'web' ? { uri: '/bg-wall.png' } : require('../public/bg-wall.png');

const ATTRS: { key: AttributeKey; label: string; emoji: string; color: string; desc: string }[] = [
  { key: 'flow',        label: 'Flow',        emoji: '🌊', color: '#3498DB', desc: 'Ritmo e cadência' },
  { key: 'tecnica',     label: 'Técnica',     emoji: '🎯', color: '#E67E22', desc: 'Precisão lírica' },
  { key: 'frieza',      label: 'Frieza',      emoji: '🧊', color: '#1ABC9C', desc: 'Controle sob pressão' },
  { key: 'inteligencia',label: 'Inteligência',emoji: '🧠', color: PURPLE,    desc: 'Profundidade e refs' },
  { key: 'presenca',    label: 'Presença',    emoji: '🎤', color: '#E74C3C', desc: 'Impacto na plateia' },
  { key: 'punchline',   label: 'Punchline',   emoji: '💥', color: GOLD,      desc: 'Força das frases' },
];

export default function CareerScreen() {
  const career    = useCareerStore();
  const character = useCharacterStore(s => s.character);

  const rpNeeded  = rpForLevel(career.level);
  const rpPct     = Math.min(100, (career.rp / rpNeeded) * 100);
  const hasPoints = career.attributePoints > 0;
  const accent    = character?.archetypeColor ?? GOLD;

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      <View style={s.overlay} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={20} color={GOLD} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.title}>CARREIRA</Text>
          <Text style={s.sub}>UNDERGROUND · SÃO PAULO</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero — personagem + nome */}
        <View style={s.hero}>
          <View style={s.charWrap}>
            <View style={[s.charGlow, { backgroundColor: accent + '30' }]} />
            <CharacterLayered look={character?.look ?? DEFAULT_LOOK} size={120} />
          </View>
          <View style={s.heroInfo}>
            <Text style={s.heroName}>{character?.battleName ?? 'SEU MC'}</Text>
            <View style={[s.archBadge, { borderColor: accent }]}>
              <Text style={[s.archTxt, { color: accent }]}>
                {character?.archetypeIcon} {character?.archetype ?? 'MC INICIANTE'}
              </Text>
            </View>
            {/* HYPE */}
            <View style={s.hypeRow}>
              <Text style={s.hypeFireIcon}>🔥</Text>
              <Text style={s.hypeVal}>{career.hype}</Text>
              <Text style={s.hypeLbl}>{career.hype === 1 ? 'DIA' : 'DIAS'} DE HYPE</Text>
            </View>
          </View>
        </View>

        {/* RP / Nível */}
        <View style={s.rpCard}>
          <View style={s.rpTop}>
            <View style={s.lvlBadge}>
              <Text style={s.lvlNum}>{career.level}</Text>
              <Text style={s.lvlLbl}>NÍVEL</Text>
            </View>
            <View style={s.rpInfo}>
              <View style={s.rpRow}>
                <Text style={s.rpLbl}>PONTOS DE RIMA</Text>
                <Text style={s.rpVal}>{career.rp} <Text style={s.rpOf}>/ {rpNeeded} RP</Text></Text>
              </View>
              <View style={s.rpBg}>
                <View style={[s.rpFill, { width: `${rpPct}%` as any, backgroundColor: accent }]} />
              </View>
              <Text style={s.rpHint}>+{rpNeeded - career.rp} RP para nível {career.level + 1}</Text>
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={s.statsGrid}>
          {([
            ['🏆', 'TROFÉUS',   `${career.trophies.length}`,                                           GOLD],
            ['📄', 'FOLHINHAS', `${career.leaves}`,                                                     PURPLE],
            ['🤝', 'AMIGOS',    `${Object.values(career.friendships).filter(v => v >= 50).length}`,     Colors.neon],
            ['🎤', 'PARCEIROS', `${career.partners.length}`,                                            '#FF5500'],
          ] as [string, string, string, string][]).map(([icon, lbl, val, color]) => (
            <View key={lbl} style={s.statBox}>
              <Text style={s.statIcon}>{icon}</Text>
              <Text style={[s.statVal, { color }]}>{val}</Text>
              <Text style={s.statLbl}>{lbl}</Text>
            </View>
          ))}
        </View>

        {/* Attribute points banner */}
        {hasPoints && (
          <View style={s.pointsBanner}>
            <Text style={s.pointsBannerTxt}>
              ⚡ {career.attributePoints} PONTO{career.attributePoints > 1 ? 'S' : ''} DE ATRIBUTO DISPONÍVEL{career.attributePoints > 1 ? 'IS' : ''}
            </Text>
          </View>
        )}

        {/* Atributos */}
        <Text style={s.sectionLabel}>// ATRIBUTOS</Text>
        <View style={s.attrList}>
          {ATTRS.map(attr => {
            const val = career.attributes[attr.key];
            const pct = (val / 20) * 100;
            return (
              <View key={attr.key} style={s.attrRow}>
                <Text style={s.attrEmoji}>{attr.emoji}</Text>
                <View style={s.attrInfo}>
                  <View style={s.attrNameRow}>
                    <Text style={s.attrName}>{attr.label}</Text>
                    <Text style={s.attrDesc}>{attr.desc}</Text>
                  </View>
                  <View style={s.attrBarRow}>
                    <View style={s.attrBg}>
                      <View style={[s.attrFill, { width: `${pct}%` as any, backgroundColor: attr.color }]} />
                    </View>
                    <Text style={[s.attrVal, { color: attr.color }]}>{val}</Text>
                  </View>
                </View>
                {hasPoints && (
                  <TouchableOpacity
                    style={[s.addBtn, { borderColor: attr.color }]}
                    onPress={() => career.spendAttributePoint(attr.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.addBtnTxt, { color: attr.color }]}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Parceiros */}
        {career.partners.length > 0 && (
          <>
            <Text style={s.sectionLabel}>// PARCEIROS</Text>
            <View style={s.partnerList}>
              {career.partners.map(id => (
                <View key={id} style={s.partnerChip}>
                  <Text style={s.partnerChipTxt}>🤝 {id}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060606' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },

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

  scroll: { padding: 16, gap: 16 },

  // Hero
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  charWrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  charGlow: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(20px)' } as any) : {}),
  },
  heroInfo: { flex: 1, gap: 6 },
  heroName: { fontFamily: GRAFFITI, color: '#FFF', fontSize: 24, letterSpacing: 2 },
  archBadge:{ alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  archTxt:  { fontFamily: GRAFFITI, fontSize: 13, letterSpacing: 1 },
  hypeRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  hypeFireIcon: { fontSize: 14 },
  hypeVal:  { fontFamily: GRAFFITI, color: '#FF6600', fontSize: 20, lineHeight: 22 },
  hypeLbl:  { fontFamily: GRAFFITI, color: '#FF6600', fontSize: 10, letterSpacing: 2, opacity: 0.8 },

  // RP Card
  rpCard: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  rpTop:   { flexDirection: 'row', alignItems: 'center', gap: 16 },
  lvlBadge:{
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,170,0,0.12)',
    borderWidth: 2, borderColor: GOLD + '60',
    alignItems: 'center', justifyContent: 'center',
  },
  lvlNum:  { fontFamily: GRAFFITI, color: GOLD, fontSize: 28, lineHeight: 30 },
  lvlLbl:  { fontFamily: GRAFFITI, color: GOLD + '80', fontSize: 10, letterSpacing: 2 },
  rpInfo:  { flex: 1, gap: 6 },
  rpRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rpLbl:   { fontFamily: GRAFFITI, color: '#555', fontSize: 11, letterSpacing: 2 },
  rpVal:   { fontFamily: GRAFFITI, color: '#FFF', fontSize: 18 },
  rpOf:    { fontSize: 13, color: '#555' },
  rpBg:    { height: 7, backgroundColor: '#1A1A1A', borderRadius: 4 },
  rpFill:  { height: 7, borderRadius: 4 },
  rpHint:  { color: '#444', fontSize: 10, fontFamily: GRAFFITI, letterSpacing: 1 },

  // Stats grid
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 10, alignItems: 'center', gap: 2,
  },
  statIcon: { fontSize: 18 },
  statVal:  { fontFamily: GRAFFITI, fontSize: 22 },
  statLbl:  { fontFamily: GRAFFITI, color: '#444', fontSize: 9, letterSpacing: 1 },

  // Points banner
  pointsBanner: {
    backgroundColor: '#FF5500' + '18', borderRadius: 6,
    borderWidth: 1, borderColor: '#FF5500',
    padding: 12, alignItems: 'center',
  },
  pointsBannerTxt: { fontFamily: GRAFFITI, color: '#FF5500', fontSize: 16, letterSpacing: 2 },

  sectionLabel: { fontFamily: GRAFFITI, color: '#333', fontSize: 13, letterSpacing: 5 },

  // Atributos
  attrList: { gap: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 14 },
  attrRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  attrEmoji:{ fontSize: 22, width: 28, textAlign: 'center' },
  attrInfo: { flex: 1, gap: 4 },
  attrNameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  attrName: { fontFamily: GRAFFITI, color: '#DDD', fontSize: 16, letterSpacing: 1 },
  attrDesc: { color: '#444', fontSize: 10, flex: 1 },
  attrBarRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  attrBg:   { flex: 1, height: 5, backgroundColor: '#1A1A1A', borderRadius: 3 },
  attrFill: { height: 5, borderRadius: 3 },
  attrVal:  { fontFamily: GRAFFITI, fontSize: 18, width: 26, textAlign: 'right' },
  addBtn:   { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt:{ fontSize: 18, fontWeight: '900', lineHeight: 22 },

  // Partners
  partnerList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  partnerChip: {
    backgroundColor: Colors.neon + '12', borderRadius: 4,
    borderWidth: 1, borderColor: Colors.neon,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  partnerChipTxt: { color: Colors.neon, fontSize: 12, fontWeight: '700' },
});
