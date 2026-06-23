import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCareerStore, xpForLevel } from '../src/store/careerStore';
import { useCharacterStore } from '../src/store/characterStore';
import { Colors } from '../src/theme/colors';
import { GRAFFITI } from '../src/theme/fonts';
import { AttributeKey } from '../src/types/game';

const ATTRS: { key: AttributeKey; label: string; emoji: string; color: string; desc: string }[] = [
  { key: 'flow',        label: 'Flow',        emoji: '🌊', color: Colors.flow,         desc: 'Ritmo e cadência das rimas' },
  { key: 'tecnica',     label: 'Técnica',     emoji: '🎯', color: Colors.tecnica,      desc: 'Precisão lírica e métrica' },
  { key: 'frieza',      label: 'Frieza',      emoji: '🧊', color: Colors.frieza,       desc: 'Controle sob pressão' },
  { key: 'inteligencia',label: 'Inteligência',emoji: '🧠', color: Colors.inteligencia, desc: 'Profundidade e referências' },
  { key: 'presenca',    label: 'Presença',    emoji: '🎤', color: Colors.presenca,     desc: 'Impacto na plateia' },
  { key: 'punchline',   label: 'Punchline',   emoji: '💥', color: Colors.punchline,    desc: 'Força das frases de efeito' },
];

export default function CareerScreen() {
  const career = useCareerStore();
  const character = useCharacterStore(s => s.character);

  const xpNeeded = xpForLevel(career.level);
  const xpPct    = Math.min(100, (career.xp / xpNeeded) * 100);
  const hasPoints = career.attributePoints > 0;

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={18} color={Colors.white} />
        </TouchableOpacity>
        <Text style={s.title}>CARREIRA</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* MC card */}
        <View style={s.mcCard}>
          <View style={s.mcRow}>
            <Text style={s.mcName}>{character?.battleName ?? 'SEU MC'}</Text>
            <View style={[s.archBadge, { borderColor: character?.archetypeColor ?? Colors.primary }]}>
              <Text style={[s.archTxt, { color: character?.archetypeColor ?? Colors.primary }]}>
                {character?.archetypeIcon} {character?.archetype}
              </Text>
            </View>
          </View>

          <View style={s.statsGrid}>
            {[
              ['NÍVEL',    `${career.level}`,     Colors.primary],
              ['HYPE',     `${career.hype}`,       Colors.orange],
              ['TROFÉUS',  `${career.trophies.length}`, Colors.gold],
              ['AMIGOS',   `${Object.values(career.friendships).filter(v => v >= 50).length}`, Colors.neon],
              ['PARCEIROS',`${career.partners.length}`, Colors.purple],
              ['FOLHINHAS',`${career.leaves}`,     Colors.primary],
            ].map(([lbl, val, color]) => (
              <View key={lbl as string} style={s.statBox}>
                <Text style={[s.statVal, { color: color as string }]}>{val}</Text>
                <Text style={s.statLbl}>{lbl}</Text>
              </View>
            ))}
          </View>

          {/* XP bar */}
          <View style={s.xpSection}>
            <View style={s.xpRow}>
              <Text style={s.xpLbl}>XP</Text>
              <Text style={s.xpVal}>{career.xp} / {xpNeeded}</Text>
            </View>
            <View style={s.xpBg}>
              <View style={[s.xpFill, { width: `${xpPct}%` as any }]} />
            </View>
          </View>
        </View>

        {/* Attribute points */}
        {hasPoints && (
          <View style={s.pointsBanner}>
            <Text style={s.pointsBannerTxt}>
              ⚡ {career.attributePoints} ponto{career.attributePoints > 1 ? 's' : ''} de atributo disponível{career.attributePoints > 1 ? 'is' : ''}!
            </Text>
          </View>
        )}

        {/* Attributes */}
        <Text style={s.sectionLabel}>ATRIBUTOS</Text>
        <View style={s.attrList}>
          {ATTRS.map(attr => {
            const val    = career.attributes[attr.key];
            const pct    = (val / 20) * 100; // max 20
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

        {/* Partners */}
        {career.partners.length > 0 && (
          <>
            <Text style={s.sectionLabel}>PARCEIROS</Text>
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
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  back:  { padding: 4 },
  title: { fontFamily: GRAFFITI, color: Colors.white, fontSize: 26, letterSpacing: 6 },

  scroll: { padding: 20, gap: 16 },

  mcCard: {
    backgroundColor: Colors.card, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.primary + '30',
    padding: 18, gap: 14,
  },
  mcRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mcName:   { fontFamily: GRAFFITI, color: Colors.white, fontSize: 28, letterSpacing: 3 },
  archBadge:{ borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  archTxt:  { fontFamily: GRAFFITI, fontSize: 16, letterSpacing: 2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox:   { flex: 1, minWidth: 80, backgroundColor: Colors.surface, borderRadius: 4, padding: 10, alignItems: 'center', gap: 2 },
  statVal:   { fontFamily: GRAFFITI, fontSize: 26 },
  statLbl:   { fontFamily: GRAFFITI, color: Colors.muted, fontSize: 13, letterSpacing: 2 },

  xpSection: { gap: 6 },
  xpRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  xpLbl:     { fontFamily: GRAFFITI, color: Colors.muted, fontSize: 16, letterSpacing: 3 },
  xpVal:     { fontFamily: GRAFFITI, color: Colors.primary, fontSize: 16 },
  xpBg:      { height: 6, backgroundColor: Colors.dim, borderRadius: 3 },
  xpFill:    { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },

  pointsBanner: {
    backgroundColor: Colors.orange + '18', borderRadius: 4,
    borderWidth: 1, borderColor: Colors.orange,
    padding: 12, alignItems: 'center',
  },
  pointsBannerTxt: { fontFamily: GRAFFITI, color: Colors.orange, fontSize: 18, letterSpacing: 2 },

  sectionLabel: { fontFamily: GRAFFITI, color: Colors.primary, fontSize: 18, letterSpacing: 5 },

  attrList: { gap: 10 },
  attrRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  attrEmoji:{ fontSize: 24, width: 30, textAlign: 'center' },
  attrInfo: { flex: 1, gap: 4 },
  attrNameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  attrName: { fontFamily: GRAFFITI, color: Colors.white, fontSize: 18, letterSpacing: 1 },
  attrDesc: { color: Colors.muted, fontSize: 10, flex: 1 },
  attrBarRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  attrBg:   { flex: 1, height: 6, backgroundColor: Colors.dim, borderRadius: 3 },
  attrFill: { height: 6, borderRadius: 3 },
  attrVal:  { fontFamily: GRAFFITI, fontSize: 20, width: 28, textAlign: 'right' },
  addBtn:   { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt:{ fontSize: 20, fontWeight: '900', lineHeight: 24 },

  partnerList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  partnerChip: { backgroundColor: Colors.neon + '15', borderRadius: 4, borderWidth: 1, borderColor: Colors.neon, paddingHorizontal: 12, paddingVertical: 6 },
  partnerChipTxt: { color: Colors.neon, fontSize: 12, fontWeight: '700' },
});
