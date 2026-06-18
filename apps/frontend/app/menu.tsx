import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useCharacterStore } from '../src/store/characterStore';
import { Colors } from '../src/theme/colors';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  available: boolean;
  route?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'battles',
    title: 'BATALHAS',
    subtitle: 'Modo online e solo',
    icon: '⚔️',
    color: Colors.mcOrange,
    available: true,
    route: '/lobby',
  },
  {
    id: 'career',
    title: 'MODO CARREIRA',
    subtitle: 'Suba no ranking da Aldeia',
    icon: '🏆',
    color: Colors.gold,
    available: false,
  },
  {
    id: 'achievements',
    title: 'CONQUISTAS',
    subtitle: 'Emblemas e conquistas',
    icon: '🎖️',
    color: Colors.momentGreen,
    available: false,
  },
  {
    id: 'titles',
    title: 'TÍTULOS',
    subtitle: 'Títulos desbloqueados',
    icon: '👑',
    color: Colors.beatPurpleLight,
    available: false,
  },
  {
    id: 'character',
    title: 'PERSONAGEM',
    subtitle: 'Veja e edite seu personagem',
    icon: '👤',
    color: Colors.flow,
    available: true,
    route: '/character-appearance',
  },
];

export default function MenuScreen() {
  const { username, logout } = useAuthStore();
  const { character, clearFromMemory } = useCharacterStore();

  async function handleLogout() {
    clearFromMemory();
    await logout();
    router.replace('/');
  }

  function handleItem(item: MenuItem) {
    if (!item.available) {
      Alert.alert('Em breve! 🔥', 'Esta funcionalidade está chegando. Fique ligado!');
      return;
    }
    router.push(item.route as any);
  }

  return (
    <LinearGradient colors={['#1F0A00', '#1A0A00', '#0D0400']} locations={[0, 0.4, 1]} style={styles.bg}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="leaf" size={15} color={Colors.mcOrange} />
          <Text style={styles.headerLogo}>BATALHA DA ALDEIA</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={15} color={Colors.textLight} />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Player card */}
        <View style={styles.playerCard}>
          <View style={[styles.playerIconBg, { backgroundColor: (character?.archetypeColor ?? Colors.gold) + '20' }]}>
            <Text style={styles.playerIconText}>{character?.archetypeIcon ?? '🎤'}</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{character?.battleName ?? username}</Text>
            <Text style={[styles.playerArchetype, { color: character?.archetypeColor ?? Colors.gold }]}>
              {character?.archetype ?? 'MC'}
            </Text>
            <Text style={styles.playerStats}>0 vitórias · 0 derrotas</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/character-appearance')} style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={14} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Menu list */}
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                idx < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => handleItem(item)}
              activeOpacity={item.available ? 0.65 : 0.9}
            >
              <View style={[styles.menuIconBg, { backgroundColor: item.color + '1A' }]}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuTextGroup}>
                <Text style={[styles.menuTitle, !item.available && styles.menuTitleMuted]}>
                  {item.title}
                </Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              {item.available ? (
                <Ionicons name="chevron-forward" size={17} color={Colors.textLight + '60'} />
              ) : (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>EM BREVE</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold + '20',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { color: Colors.mcOrange, fontWeight: '900', fontSize: 12, letterSpacing: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1, borderColor: Colors.gold + '30',
  },
  logoutText: { color: Colors.textLight, fontSize: 12 },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // Player card
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gold + '30',
    padding: 18,
    marginBottom: 24,
  },
  playerIconBg: {
    width: 56, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  playerIconText: { fontSize: 30 },
  playerInfo: { flex: 1 },
  playerName: { color: Colors.white, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  playerArchetype: { fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 2 },
  playerStats: { color: Colors.textLight, fontSize: 11, marginTop: 4 },
  editBtn: { padding: 6 },

  // Menu list
  menuList: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gold + '22',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gold + '12' },
  menuIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuIconText: { fontSize: 22 },
  menuTextGroup: { flex: 1 },
  menuTitle: { color: Colors.white, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  menuTitleMuted: { color: Colors.textLight },
  menuSubtitle: { color: Colors.textLight, fontSize: 12, marginTop: 1 },
  soonBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  soonText: { color: Colors.textLight, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
