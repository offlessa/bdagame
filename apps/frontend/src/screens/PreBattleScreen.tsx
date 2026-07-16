import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Platform, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCareerStore } from '../store/careerStore';
import { useCharacterStore, DEFAULT_LOOK } from '../store/characterStore';
import { getNPC } from '../data/npcs';
import { GRAFFITI } from '../theme/fonts';
import { AttributeKey } from '../types/game';
import CharacterLayered from '../components/CharacterLayered';

const GOLD   = '#FFAA00';
const BG = Platform.OS === 'web' ? { uri: '/bg-wall.png' } : require('../../public/bg-wall.png');

const PERSONALITY_COLOR: Record<string, string> = {
  chill:      '#00CED1',
  arrogante:  '#FF2020',
  timido:     '#6A5ACD',
  agitado:    GOLD,
  misterioso: '#9D00FF',
};

const ATTRS: { key: AttributeKey; label: string; emoji: string }[] = [
  { key: 'flow',         label: 'Flow',     emoji: '🌊' },
  { key: 'punchline',    label: 'Punch',    emoji: '💥' },
  { key: 'presenca',     label: 'Presença', emoji: '🎤' },
  { key: 'tecnica',      label: 'Técnica',  emoji: '🎯' },
  { key: 'frieza',       label: 'Frieza',   emoji: '🧊' },
  { key: 'inteligencia', label: 'Intel',    emoji: '🧠' },
];

function diffColor(d: 1 | 2 | 3) {
  return d === 1 ? '#39FF14' : d === 2 ? '#FF8800' : '#FF2020';
}
function diffLabel(d: 1 | 2 | 3) {
  return d === 1 ? 'INICIANTE' : d === 2 ? 'INTERMEDIÁRIO' : 'VETERANO';
}

export default function PreBattleScreen() {
  const { npcId }   = useLocalSearchParams<{ npcId: string }>();
  const career      = useCareerStore();
  const character   = useCharacterStore(s => s.character);
  const npc         = getNPC(npcId ?? '');

  const vsScale        = useRef(new Animated.Value(0.3)).current;
  const playerX        = useRef(new Animated.Value(-80)).current;
  const npcX           = useRef(new Animated.Value(80)).current;
  const speechOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(vsScale, { toValue: 1, tension: 55, friction: 5, useNativeDriver: true }),
      Animated.spring(playerX, { toValue: 0, tension: 80, friction: 7, useNativeDriver: true }),
      Animated.spring(npcX,    { toValue: 0, tension: 80, friction: 7, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.timing(speechOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 600);
  }, []);

  if (!npc) {
    return (
      <View style={s.root}>
        <Text style={{ color: '#fff', padding: 40 }}>NPC não encontrado.</Text>
      </View>
    );
  }

  const npcColor     = PERSONALITY_COLOR[npc.personality] ?? GOLD;
  const playerAccent = character?.archetypeColor ?? GOLD;
  const greeting     = npc.greetings[Math.floor(Math.random() * npc.greetings.length)];

  function startBattle() {
    router.push({ pathname: '/rap-slash', params: { npcId: npc!.id } });
  }

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      <View style={s.overlay} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={GOLD} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{npc.battleName.toUpperCase()}</Text>
          <Text style={s.headerSub}>UNDERGROUND · SÃO PAULO</Text>
        </View>
        <View style={[s.diffChip, { borderColor: diffColor(npc.difficulty) + '80', backgroundColor: diffColor(npc.difficulty) + '18' }]}>
          {Array.from({ length: npc.difficulty }).map((_, i) => (
            <View key={i} style={[s.diffDot, { backgroundColor: diffColor(npc.difficulty) }]} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── VS ── */}
        <View style={s.vsRow}>

          {/* Player */}
          <Animated.View style={[s.side, { transform: [{ translateX: playerX }] }]}>
            <View style={[s.sideGlow, { backgroundColor: playerAccent + '22' }]} />
            <CharacterLayered look={character?.look ?? DEFAULT_LOOK} size={150} />
            <View style={s.charShadow} />
            <View style={[s.sideTag, { borderColor: playerAccent + '70' }]}>
              <Text style={[s.sideTagType, { color: playerAccent }]}>
                {character?.archetypeIcon ?? '⚡'} VOCÊ
              </Text>
              <Text style={s.sideTagName} numberOfLines={1}>
                {character?.battleName ?? 'MC'}
              </Text>
              <Text style={s.sideTagSub}>LV {career.level}</Text>
            </View>
          </Animated.View>

          {/* VS */}
          <Animated.View style={[s.vsWrap, { transform: [{ scale: vsScale }] }]}>
            <View style={s.vsGlow} />
            <Text style={s.vsTxt}>VS</Text>
          </Animated.View>

          {/* NPC */}
          <Animated.View style={[s.side, { transform: [{ translateX: npcX }] }]}>
            <View style={[s.sideGlow, { backgroundColor: npcColor + '22' }]} />
            <View style={[s.npcCircleOuter, { borderColor: npcColor }]}>
              <View style={[s.npcCircleInner, { backgroundColor: npcColor + '15' }]}>
                <Text style={s.npcEmoji}>{npc.emoji}</Text>
              </View>
            </View>
            <View style={s.charShadow} />
            <View style={[s.sideTag, { borderColor: npcColor + '70' }]}>
              <Text style={[s.sideTagType, { color: npcColor }]}>
                {npc.personality.toUpperCase()}
              </Text>
              <Text style={s.sideTagName} numberOfLines={1}>{npc.name.toUpperCase()}</Text>
              <Text style={s.sideTagSub}>{diffLabel(npc.difficulty)}</Text>
            </View>
          </Animated.View>

        </View>

        {/* ── Trash talk ── */}
        <Animated.View style={[s.speech, { opacity: speechOpacity, borderColor: npcColor + '50' }]}>
          <Text style={s.speechQuote}>"</Text>
          <Text style={s.speechTxt}>{greeting}</Text>
          <Text style={[s.speechBy, { color: npcColor }]}>— {npc.name.toUpperCase()}</Text>
        </Animated.View>

        {/* ── Stat comparison ── */}
        <View style={s.statsCard}>
          <Text style={s.statsTitle}>// COMPARAÇÃO DE ATRIBUTOS</Text>
          {ATTRS.map(({ key, label, emoji }) => {
            const pv = career.attributes[key];
            const nv = npc.attributes[key];
            const mx = Math.max(pv, nv, 10);
            const playerWins = pv > nv;
            const tie        = pv === nv;
            return (
              <View key={key} style={s.attrRow}>
                {/* Player bar — grows left→right */}
                <View style={s.barLeft}>
                  <Text style={[s.barNum, { color: playerWins ? playerAccent : '#555' }]}>{pv}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, {
                      width: `${(pv / mx) * 100}%` as any,
                      backgroundColor: playerWins ? playerAccent : '#2A2A2A',
                    }]} />
                  </View>
                </View>
                {/* Label */}
                <View style={s.attrLabel}>
                  <Text style={s.attrEmoji}>{emoji}</Text>
                  <Text style={s.attrName}>{label}</Text>
                </View>
                {/* NPC bar — grows right→left */}
                <View style={s.barRight}>
                  <View style={[s.barTrack, { transform: [{ scaleX: -1 }] }]}>
                    <View style={[s.barFill, {
                      width: `${(nv / mx) * 100}%` as any,
                      backgroundColor: !playerWins && !tie ? npcColor : '#2A2A2A',
                    }]} />
                  </View>
                  <Text style={[s.barNum, { color: !playerWins && !tie ? npcColor : '#555' }]}>{nv}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Info pills ── */}
        <View style={s.pills}>
          <View style={s.pill}><Text style={s.pillTxt}>💰 {npc.inscricao}</Text></View>
          <View style={s.pill}><Text style={s.pillTxt}>🏆 {npc.premiacao}</Text></View>
          <View style={s.pill}><Text style={s.pillTxt}>📋 {npc.formato}</Text></View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── CTA ── */}
      <View style={s.ctaWrap}>
        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: npcColor }]}
          onPress={startBattle}
          activeOpacity={0.85}
        >
          <View style={s.ctaShine} />
          <Text style={s.ctaIcon}>⚔</Text>
          <Text style={s.ctaTxt}>BATALHAR AGORA</Text>
          <Ionicons name="chevron-forward" size={22} color="rgba(0,0,0,0.35)" />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060606' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  backBtn: { padding: 6 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: GRAFFITI, color: '#FFF', fontSize: 18, letterSpacing: 3 },
  headerSub:   { fontFamily: GRAFFITI, color: '#555', fontSize: 11, letterSpacing: 3, marginTop: -2 },
  diffChip: {
    flexDirection: 'row', gap: 4, borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 5,
  },
  diffDot: { width: 7, height: 7, borderRadius: 4 },

  scroll: { paddingBottom: 16, gap: 14 },

  // VS Row
  vsRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingTop: 20, gap: 4,
  },
  side: { flex: 1, alignItems: 'center', position: 'relative' },
  sideGlow: {
    position: 'absolute', top: 0, left: -30, right: -30, bottom: 0,
    borderRadius: 20,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(35px)' } as any) : {}),
  },
  charShadow: {
    width: 90, height: 10, borderRadius: 45,
    backgroundColor: 'rgba(0,0,0,0.55)', marginTop: -3,
  },
  sideTag: {
    marginTop: 8, borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 6,
    alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)',
    width: '100%',
  },
  sideTagType: { fontFamily: GRAFFITI, fontSize: 10, letterSpacing: 2 },
  sideTagName: { fontFamily: GRAFFITI, color: '#FFF', fontSize: 14, letterSpacing: 1 },
  sideTagSub:  { color: '#666', fontSize: 9, letterSpacing: 1, marginTop: 1 },

  // NPC avatar
  npcCircleOuter: {
    width: 130, height: 130, borderRadius: 65, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', marginBottom: -3,
  },
  npcCircleInner: {
    width: 116, height: 116, borderRadius: 58,
    alignItems: 'center', justifyContent: 'center',
  },
  npcEmoji: { fontSize: 64 },

  // VS center
  vsWrap: { alignItems: 'center', justifyContent: 'center', paddingBottom: 50, position: 'relative' },
  vsGlow: {
    position: 'absolute',
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#FF2020', opacity: 0.22,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(18px)' } as any) : {}),
  },
  vsTxt: { fontFamily: GRAFFITI, color: '#FF2020', fontSize: 34, letterSpacing: 4 },

  // Speech
  speech: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderLeftWidth: 3, borderRadius: 6,
    borderWidth: 1, padding: 14, gap: 4,
  },
  speechQuote: { color: '#444', fontSize: 28, lineHeight: 20, fontFamily: GRAFFITI },
  speechTxt:   { color: '#CCC', fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginLeft: 6 },
  speechBy:    { fontFamily: GRAFFITI, fontSize: 10, letterSpacing: 3, marginTop: 4, marginLeft: 6 },

  // Stats
  statsCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    gap: 9,
  },
  statsTitle: { fontFamily: GRAFFITI, color: '#333', fontSize: 11, letterSpacing: 5, marginBottom: 2 },
  attrRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  barRight:{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  barTrack: { flex: 1, height: 5, backgroundColor: '#1A1A1A', borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: 5, borderRadius: 3 },
  barNum:   { fontFamily: GRAFFITI, fontSize: 14, width: 22, textAlign: 'center' },
  attrLabel: { width: 56, alignItems: 'center', gap: 1 },
  attrEmoji: { fontSize: 13 },
  attrName:  { fontFamily: GRAFFITI, color: '#444', fontSize: 9, letterSpacing: 1 },

  // Pills
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  pillTxt: { color: '#777', fontSize: 12, fontFamily: GRAFFITI, letterSpacing: 1 },

  // CTA
  ctaWrap: {
    paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, paddingVertical: 18, gap: 10,
    overflow: 'hidden', position: 'relative',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14,
    elevation: 12,
  },
  ctaShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  ctaIcon: { fontSize: 22 },
  ctaTxt:  { fontFamily: GRAFFITI, color: '#000', fontSize: 23, letterSpacing: 6 },
});
