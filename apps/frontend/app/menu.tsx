import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ImageBackground, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore, DEFAULT_LOOK } from '../src/store/characterStore';
import { useCareerStore, rpForLevel } from '../src/store/careerStore';
import { GRAFFITI } from '../src/theme/fonts';
import CharacterLayered from '../src/components/CharacterLayered';

const GOLD   = '#FFAA00';
const PURPLE = '#9D00FF';

const BG = Platform.OS === 'web' ? { uri: '/bg-wall.png' } : require('../public/bg-wall.png');


export default function MenuScreen() {
  const { username, logout } = useAuthStore();
  const { character, clearFromMemory } = useCharacterStore();
  const career = useCareerStore();

  async function handleLogout() {
    clearFromMemory();
    await logout();
    router.replace('/');
  }

  const accent    = character?.archetypeColor ?? GOLD;
  const rpNeeded = rpForLevel(career.level);
  const rpPct    = Math.min(100, (career.rp / rpNeeded) * 100);
  const mcTitle  = character?.archetype ?? 'MC INICIANTE';

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      <View style={s.overlay} />

      {/* ══════════ TOP HUD ══════════ */}
      <View style={s.topHud}>

        {/* Avatar + nome + RP */}
        <View style={s.playerBlock}>
          <View style={[s.avatarCircle, { borderColor: accent }]}>
            <Text style={s.avatarIcon}>{character?.archetypeIcon ?? '⚡'}</Text>
          </View>
          <View style={s.playerInfo}>
            <Text style={s.playerName} numberOfLines={1}>
              {character?.battleName ?? username ?? 'MC'}
            </Text>
            <Text style={s.levelTxt}>LV {career.level}</Text>
            <View style={s.xpRow}>
              <View style={s.xpBg}>
                <View style={[s.xpFill, { width: `${rpPct}%` as any, backgroundColor: accent }]} />
              </View>
              <Text style={s.xpTxt}>{career.rp} / {rpNeeded} RP</Text>
            </View>
          </View>
        </View>

        {/* HYPE — streak de dias */}
        <View style={s.hypeBox}>
          <Text style={s.hypeNum}>{career.hype}</Text>
          <View style={s.hypeFooter}>
            <Text style={s.hypeFireIcon}>🔥</Text>
            <Text style={s.hypeLbl}>{career.hype === 1 ? 'DIA' : 'DIAS'}</Text>
          </View>
        </View>

        {/* Troféus + Gemas */}
        <View style={s.statsCol}>
          <View style={s.statBox}>
            <Text style={s.statIcon}>🏆</Text>
            <Text style={s.statVal}>{career.trophies.length}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statIcon}>💎</Text>
            <Text style={s.statVal}>{career.leaves}</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={s.logoutBtn}
          >
            <Ionicons name="log-out-outline" size={16} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ══════════ PERSONAGEM ══════════ */}
      <View style={s.charArea}>

        {/* Nome do personagem */}
        <View style={s.nameTag} pointerEvents="none">
          <Text style={s.nameTagTop}>👑 PERSONAGEM</Text>
          <Text style={s.nameTagName}>{character?.battleName ?? username ?? 'MC'}</Text>
          <Text style={s.nameTagSub}>{mcTitle.toUpperCase()}</Text>
        </View>

        {/* Glow roxo + character */}
        <View style={s.charWrap} pointerEvents="none">
          <View style={s.glowOuter} />
          <View style={s.glowInner} />
          <CharacterLayered look={character?.look ?? DEFAULT_LOOK} size={220} />
          <View style={s.charShadow} />
        </View>

      </View>

      {/* ══════════ BATALHAR CARD ══════════ */}
      <TouchableOpacity
        style={s.battleCard}
        onPress={() => router.push('/world')}
        activeOpacity={0.85}
      >
        {/* Textura / gradiente */}
        <View style={s.battleCardShine} />
        <View style={s.battleCardDark} />

        {/* Ícone de microfones */}
        <View style={s.battleIconWrap}>
          <Text style={s.battleMicIcon}>🎤</Text>
          <Text style={[s.battleMicIcon, s.battleMicFlip]}>🎤</Text>
        </View>

        {/* Texto */}
        <View style={s.battleContent}>
          <Text style={s.battleTitle}>BATALHAR</Text>
          <Text style={s.battleNextLbl}>Escolha seu oponente</Text>
          <Text style={s.battleNextName}>UNDERGROUND · SP</Text>
          <View style={s.rewardPill}>
            <Text style={s.rewardTxt}>🗺️  MAPA DA CARREIRA</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={26} color="rgba(0,0,0,0.4)" />
      </TouchableOpacity>

      {/* ══════════ BOTTOM NAV ══════════ */}
      <View style={s.bottomNav}>
        <NavTab
          icon="trophy"       label="CARREIRA"   color={GOLD}
          onPress={() => router.push('/career')}
          badge
        />
        <NavTab
          icon="person"       label="PERSONAGEM" color="#1E90FF"
          onPress={() => router.push('/character-appearance')}
        />
        <NavTab
          icon="book"         label="COLEÇÃO"    color={PURPLE}
          onPress={() => router.push('/collection')}
        />
        <NavTab
          icon="stats-chart"  label="RANKING"    color="#FF6600"
          onPress={() => Alert.alert('Em breve')} locked
        />
      </View>

    </ImageBackground>
  );
}

/* ── NavTab ── */
function NavTab({ icon, label, color, onPress, badge, locked }: {
  icon: any; label: string; color: string;
  onPress: () => void; badge?: boolean; locked?: boolean;
}) {
  return (
    <TouchableOpacity style={n.tab} onPress={onPress} activeOpacity={0.75}>
      <View style={n.iconWrap}>
        <Ionicons name={icon as any} size={26} color={locked ? '#3A3A3A' : color} />
        {badge && (
          <View style={n.badge}>
            <Text style={n.badgeTxt}>!</Text>
          </View>
        )}
      </View>
      <Text style={[n.label, { color: locked ? '#3A3A3A' : '#AAA' }]}>{label}</Text>
      {!locked && <View style={[n.accent, { backgroundColor: color }]} />}
    </TouchableOpacity>
  );
}

/* ── Styles ── */
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060606' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },

  // TOP HUD
  topHud: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },

  playerBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2.5, backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon:  { fontSize: 22 },
  playerInfo:  { flex: 1 },
  playerName:  { fontFamily: GRAFFITI, color: '#FFF', fontSize: 17, letterSpacing: 1 },
  levelTxt:    { fontFamily: GRAFFITI, color: GOLD, fontSize: 12, marginTop: 1 },
  xpRow:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  xpBg:        { flex: 1, height: 5, backgroundColor: '#1E1E1E', borderRadius: 3 },
  xpFill:      { height: 5, borderRadius: 3 },
  xpTxt:       { color: '#555', fontSize: 9, fontFamily: GRAFFITI },

  hypeBox: {
    borderWidth: 1.5, borderColor: '#FF6600' + '80',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    minWidth: 72, alignItems: 'center',
    backgroundColor: 'rgba(255,100,0,0.1)',
  },
  hypeNum:      { fontFamily: GRAFFITI, color: '#FF6600', fontSize: 26, lineHeight: 28 },
  hypeFooter:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  hypeFireIcon: { fontSize: 12 },
  hypeLbl:      { fontFamily: GRAFFITI, color: '#FF6600', fontSize: 11, letterSpacing: 2, opacity: 0.8 },

  statsCol:  { gap: 4, alignItems: 'flex-end' },
  statBox:   {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#2A2A2A',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  statIcon: { fontSize: 12 },
  statVal:  { fontFamily: GRAFFITI, color: '#CCC', fontSize: 13 },
  logoutBtn: { marginTop: 2 },

  // CHAR AREA
  charArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  nameTag: { alignItems: 'center', marginBottom: 6 },
  nameTagTop:  { fontFamily: GRAFFITI, color: PURPLE, fontSize: 13, letterSpacing: 3 },
  nameTagName: { fontFamily: GRAFFITI, color: '#FFF', fontSize: 22, letterSpacing: 2, marginTop: -2 },
  nameTagSub:  { color: '#888', fontSize: 12, letterSpacing: 2, marginTop: -2 },

  charWrap: { alignItems: 'center', justifyContent: 'flex-end' },
  glowOuter: {
    position: 'absolute',
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: PURPLE,
    opacity: 0.18,
    bottom: 30,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(60px)' } as any) : {
      shadowColor: PURPLE,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 60,
    }),
  },
  glowInner: {
    position: 'absolute',
    width: 160, height: 220, borderRadius: 80,
    backgroundColor: PURPLE,
    opacity: 0.22,
    bottom: 30,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(30px)' } as any) : {}),
  },
  charShadow: {
    width: 140, height: 14, borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.6)',
    marginTop: -6,
  },

  // BATALHAR CARD
  battleCard: {
    marginHorizontal: 12, marginBottom: 10,
    backgroundColor: GOLD,
    borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  battleCardShine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: 14, borderTopRightRadius: 14,
  },
  battleCardDark: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
  },
  battleIconWrap: { flexDirection: 'row', gap: -10 },
  battleMicIcon:  { fontSize: 32 },
  battleMicFlip:  { transform: [{ scaleX: -1 }] },
  battleContent:  { flex: 1, gap: 1 },
  battleTitle:    { fontFamily: GRAFFITI, color: '#0A0A0A', fontSize: 26, letterSpacing: 4 },
  battleNextLbl:  { color: 'rgba(0,0,0,0.5)', fontSize: 11, fontFamily: GRAFFITI, letterSpacing: 1 },
  battleNextName: { fontFamily: GRAFFITI, color: '#0A0A0A', fontSize: 15, letterSpacing: 1 },
  rewardPill: {
    alignSelf: 'flex-start', marginTop: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  rewardTxt: { fontFamily: GRAFFITI, color: '#0A0A0A', fontSize: 12, letterSpacing: 1 },

  // BOTTOM NAV
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 28, paddingTop: 6,
  },
});

const n = StyleSheet.create({
  tab: { flex: 1, alignItems: 'center', paddingTop: 8, gap: 4, position: 'relative' },
  iconWrap: { position: 'relative' },
  label: { fontFamily: GRAFFITI, fontSize: 10, letterSpacing: 1 },
  badge: {
    position: 'absolute', top: -4, right: -6,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#FF2200',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeTxt: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  accent: { position: 'absolute', bottom: -6, height: 2, width: 24, borderRadius: 1 },
});
