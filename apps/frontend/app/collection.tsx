import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ImageBackground, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCareerStore } from '../src/store/careerStore';
import { NPCS } from '../src/data/npcs';
import { GRAFFITI } from '../src/theme/fonts';
import { FOLHINHA_DATA } from '../src/components/FolhinhaArt';

const GOLD = '#FFAA00';
const BG = Platform.OS === 'web' ? { uri: '/bg-wall.png' } : require('../public/bg-wall.png');

const FW = 320;
const FH = 210;
const ART_H = 130;

// ── Folhinha component ────────────────────────────────────────────────────────

function Folhinha({ npc }: { npc: typeof NPCS[0] }) {
  const data = FOLHINHA_DATA[npc.id];
  if (!data) return null;
  const { Art, accent, rotation } = data;

  return (
    <View style={[f.wrapper, { transform: [{ rotate: `${rotation}deg` }] }]}>
      <View style={[f.pin, { backgroundColor: accent }]} />
      <View style={f.paper}>
        {/* Arte */}
        <View style={f.artArea}>
          <Art width={FW} height={ART_H} />
        </View>

        <View style={[f.divider, { backgroundColor: accent + '60' }]} />

        {/* Info */}
        <View style={f.info}>
          <View style={f.infoLeft}>
            <Text style={f.battleName} numberOfLines={1}>
              {npc.battleName.toUpperCase()}
            </Text>
            <Text style={f.city}>São Paulo · Underground</Text>
          </View>
          <View style={[f.stamp, { borderColor: accent }]}>
            <Text style={[f.stampTxt, { color: accent }]}>VENCIDA</Text>
          </View>
        </View>

        {/* Linhas de papel */}
        {[0, 1, 2].map(i => (
          <View key={i} style={[f.paperLine, { top: 150 + i * 14 }]} />
        ))}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CollectionScreen() {
  const { defeatedNpcIds } = useCareerStore();
  const collected = NPCS.filter(n => defeatedNpcIds.includes(n.id));

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      <View style={s.overlay} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/menu')} style={s.back}>
          <Ionicons name="arrow-back" size={20} color={GOLD} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.title}>COLEÇÃO</Text>
          <Text style={s.sub}>MURAL DE FOLHINHAS</Text>
        </View>
        <View style={s.counter}>
          <Text style={s.counterNum}>{collected.length}</Text>
          <Text style={s.counterOf}>/ {NPCS.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.mural, collected.length === 0 && s.muralEmpty]}
        showsVerticalScrollIndicator={false}
      >
        {collected.length === 0 ? (
          /* Estado vazio */
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📄</Text>
            <Text style={s.emptyTitle}>MURAL VAZIO</Text>
            <Text style={s.emptyDesc}>
              Vença batalhas para{'\n'}conquistar suas folhinhas
            </Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.replace('/world')}>
              <Text style={s.emptyBtnTxt}>IR PARA O MAPA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.muralLabel}>// SUAS FOLHINHAS</Text>
            {collected.map(npc => (
              <Folhinha key={npc.id} npc={npc} />
            ))}
            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const f = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  pin: {
    width: 14, height: 14, borderRadius: 7,
    zIndex: 2, marginBottom: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  paper: {
    width: FW, height: FH,
    backgroundColor: '#F2EDE0',
    borderRadius: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    position: 'relative',
  },
  artArea:   { width: FW, height: ART_H, overflow: 'hidden' },
  divider:   { height: 1.5 },
  info: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 8,
    justifyContent: 'space-between',
  },
  infoLeft:   { flex: 1 },
  battleName: { fontSize: 15, fontWeight: '900', letterSpacing: 1, color: '#111' },
  city:       { color: '#888', fontSize: 10, marginTop: 1, letterSpacing: 1 },
  stamp: {
    borderWidth: 2, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    transform: [{ rotate: '-4deg' }],
  },
  stampTxt:  { fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  paperLine: {
    position: 'absolute', left: 14, right: 14, height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060606' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,170,0,0.15)',
  },
  back: { padding: 6 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontFamily: GRAFFITI, color: GOLD, fontSize: 26, letterSpacing: 6 },
  sub:   { fontFamily: GRAFFITI, color: '#555', fontSize: 12, letterSpacing: 3, marginTop: -2 },
  counter: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  counterNum: { fontFamily: GRAFFITI, color: GOLD, fontSize: 22 },
  counterOf:  { fontFamily: GRAFFITI, color: '#555', fontSize: 14 },

  mural: {
    paddingTop: 28, paddingHorizontal: 20,
    alignItems: 'center',
  },
  muralEmpty: {
    flex: 1, justifyContent: 'center',
  },
  muralLabel: {
    fontFamily: GRAFFITI, color: '#333', fontSize: 13, letterSpacing: 6,
    alignSelf: 'flex-start', marginBottom: 24, marginLeft: 8,
  },

  empty: { alignItems: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIcon:  { fontSize: 64, opacity: 0.3 },
  emptyTitle: { fontFamily: GRAFFITI, color: '#444', fontSize: 28, letterSpacing: 6 },
  emptyDesc:  { color: '#555', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 8,
    borderWidth: 1, borderColor: GOLD + '60',
    borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyBtnTxt: { fontFamily: GRAFFITI, color: GOLD, fontSize: 16, letterSpacing: 3 },
});
