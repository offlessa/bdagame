import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Alert,
  ScrollView, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useSocket, getSocket } from '../hooks/useSocket';
import { useSoloStore } from '../store/soloStore';
import { Colors } from '../theme/colors';

type Section = 'play' | 'ranking' | 'cards';

export default function LobbyScreen() {
  const { username, logout } = useAuthStore();
  const { roomId, phase } = useGameStore();
  const soloStore = useSoloStore();
  const [section, setSection] = useState<Section>('play');
  const [joinCode, setJoinCode] = useState('');
  const [onlineMode, setOnlineMode] = useState(false);
  const { width } = useWindowDimensions();
  const sidebarCollapsed = width < 700;
  useSocket();

  useEffect(() => {
    if (phase === 'draft') router.replace('/draft');
  }, [phase]);

  function createRoom() {
    getSocket()?.emit('room:create');
    setOnlineMode(true);
  }

  function joinRoom() {
    if (!joinCode.trim()) { Alert.alert('Digite o código da sala'); return; }
    getSocket()?.emit('room:join', { roomId: joinCode.trim().toUpperCase() });
    setOnlineMode(true);
  }

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: 'play', label: 'Jogar', icon: '⚔️' },
    { id: 'ranking', label: 'Ranking', icon: '🏆' },
    { id: 'cards', label: 'Cartas', icon: '🃏' },
  ];

  return (
    <View style={styles.root}>
      {/* ── Navbar ───────────────────────────────────────────────── */}
      <View style={styles.navbar}>
        <Text style={styles.navLogo}>BATALHA DA ALDEIA</Text>
        <View style={styles.navRight}>
          <Text style={styles.navUser}>{username}</Text>
          <TouchableOpacity style={styles.navLogout} onPress={handleLogout}>
            <Text style={styles.navLogoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <View style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.sideItem, section === item.id && styles.sideItemActive]}
              onPress={() => { setSection(item.id); setOnlineMode(false); }}
            >
              <Text style={styles.sideIcon}>{item.icon}</Text>
              {!sidebarCollapsed && (
                <Text style={[styles.sideLabel, section === item.id && styles.sideLabelActive]}>
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Main content ─────────────────────────────────────────── */}
        <ScrollView contentContainerStyle={styles.main}>
          {section === 'play' && !onlineMode && (
            <>
              <Text style={styles.sectionTitle}>ESCOLHA O MODO</Text>
              <Text style={styles.sectionSub}>Como você quer jogar hoje?</Text>

              <View style={styles.modeGrid}>
                {/* Solo */}
                <TouchableOpacity style={styles.modeCard} onPress={() => { soloStore.reset(); soloStore.startDraft(); router.push('/solo-draft'); }}>
                  <LinearGradient colors={['#2C1A0E', '#1A0A00']} style={styles.modeCardGradient}>
                    <Text style={styles.modeCardIcon}>🎤</Text>
                    <Text style={styles.modeCardTitle}>SOLO</Text>
                    <Text style={styles.modeCardDesc}>Treine suas habilidades contra a IA</Text>
                    <View style={styles.playBadge}>
                      <Text style={styles.playBadgeText}>JOGAR</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Online */}
                <TouchableOpacity style={styles.modeCard} onPress={() => setOnlineMode(true)}>
                  <LinearGradient colors={[Colors.mcOrange + '22', '#1A0A00']} style={styles.modeCardGradient}>
                    <Text style={styles.modeCardIcon}>🌐</Text>
                    <Text style={[styles.modeCardTitle, { color: Colors.mcOrange }]}>ONLINE</Text>
                    <Text style={styles.modeCardDesc}>Desafie outros jogadores em tempo real</Text>
                    <View style={styles.playBadge}>
                      <Text style={styles.playBadgeText}>JOGAR</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}

          {section === 'play' && onlineMode && (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={() => { setOnlineMode(false); setJoinCode(''); }}>
                <Text style={styles.backBtnText}>← Voltar</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>MODO ONLINE</Text>

              {roomId && phase === 'lobby' ? (
                <View style={styles.waitingBox}>
                  <Text style={styles.waitingLabel}>Código da sua sala</Text>
                  <Text style={styles.waitingCode}>{roomId}</Text>
                  <Text style={styles.waitingHint}>Compartilhe esse código com seu oponente</Text>
                  <View style={styles.waitingDots}>
                    <Text style={styles.waitingDotsText}>Aguardando oponente...</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.onlineOptions}>
                  <TouchableOpacity style={styles.createBtn} onPress={createRoom}>
                    <Text style={styles.createBtnIcon}>＋</Text>
                    <Text style={styles.createBtnText}>CRIAR SALA</Text>
                    <Text style={styles.createBtnSub}>Gere um código e convide alguém</Text>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>ou</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.joinBox}>
                    <Text style={styles.joinLabel}>ENTRAR EM UMA SALA</Text>
                    <TextInput
                      style={styles.joinInput}
                      placeholder="CÓDIGO DA SALA"
                      placeholderTextColor={Colors.textLight}
                      value={joinCode}
                      onChangeText={setJoinCode}
                      autoCapitalize="characters"
                      maxLength={6}
                    />
                    <TouchableOpacity style={styles.joinBtn} onPress={joinRoom}>
                      <Text style={styles.joinBtnText}>ENTRAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {section === 'ranking' && (
            <>
              <Text style={styles.sectionTitle}>RANKING</Text>
              <Text style={styles.sectionSub}>Os melhores do Aldeia</Text>
              <TouchableOpacity style={styles.rankingFullBtn} onPress={() => router.push('/ranking')}>
                <Text style={styles.rankingFullBtnText}>Ver ranking completo →</Text>
              </TouchableOpacity>
            </>
          )}

          {section === 'cards' && (
            <>
              <Text style={styles.sectionTitle}>COLEÇÃO</Text>
              <Text style={styles.sectionSub}>Explore as cartas do jogo</Text>
              <TouchableOpacity style={styles.rankingFullBtn} onPress={() => router.push('/cards' as never)}>
                <Text style={styles.rankingFullBtnText}>Ver todas as cartas →</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // Navbar
  navbar: {
    height: 56, backgroundColor: '#0F0600', borderBottomWidth: 1,
    borderBottomColor: Colors.gold + '30', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24,
  },
  navLogo: { color: Colors.mcOrange, fontWeight: '900', fontSize: 16, letterSpacing: 2 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  navUser: { color: Colors.gold, fontSize: 13 },
  navLogout: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: Colors.gold + '40' },
  navLogoutText: { color: Colors.textLight, fontSize: 13 },

  // Layout
  body: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    width: 180, backgroundColor: '#0F0600', borderRightWidth: 1,
    borderRightColor: Colors.gold + '20', paddingTop: 16, paddingHorizontal: 8,
  },
  sidebarCollapsed: { width: 60 },
  sideItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4,
  },
  sideItemActive: { backgroundColor: Colors.mcOrange + '20' },
  sideIcon: { fontSize: 20 },
  sideLabel: { color: Colors.textLight, fontSize: 14, fontWeight: '600' },
  sideLabelActive: { color: Colors.mcOrange },

  // Main
  main: { flexGrow: 1, padding: 32 },
  sectionTitle: { color: Colors.white, fontSize: 28, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  sectionSub: { color: Colors.textLight, fontSize: 14, marginBottom: 32 },

  // Mode cards
  modeGrid: { flexDirection: 'row', gap: 20, flexWrap: 'wrap' },
  modeCard: { flex: 1, minWidth: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.gold + '20' },
  modeCardDisabled: { opacity: 0.6 },
  modeCardGradient: { padding: 32, alignItems: 'center', gap: 12 },
  modeCardIcon: { fontSize: 48 },
  modeCardTitle: { color: Colors.white, fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  modeCardDesc: { color: Colors.textLight, fontSize: 13, textAlign: 'center' },
  comingSoonBadge: { marginTop: 8, backgroundColor: Colors.textLight + '30', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  comingSoonText: { color: Colors.textLight, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  playBadge: { marginTop: 8, backgroundColor: Colors.mcOrange, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 6 },
  playBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '900', letterSpacing: 2 },

  // Online mode
  backBtn: { marginBottom: 20 },
  backBtnText: { color: Colors.gold, fontSize: 14 },
  onlineOptions: { maxWidth: 480, width: '100%' },
  createBtn: {
    backgroundColor: Colors.mcOrange + '15', borderWidth: 1, borderColor: Colors.mcOrange + '50',
    borderRadius: 16, padding: 24, alignItems: 'center', gap: 6,
  },
  createBtnIcon: { fontSize: 32, color: Colors.mcOrange },
  createBtnText: { color: Colors.mcOrange, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  createBtnSub: { color: Colors.textLight, fontSize: 13 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gold + '20' },
  dividerText: { color: Colors.textLight, fontSize: 13 },

  joinBox: { gap: 12 },
  joinLabel: { color: Colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  joinInput: {
    backgroundColor: Colors.offWhite + '10', borderWidth: 1, borderColor: Colors.gold + '40',
    borderRadius: 10, color: Colors.white, padding: 14, fontSize: 22,
    textAlign: 'center', letterSpacing: 8,
  },
  joinBtn: { backgroundColor: Colors.beatPurple, borderRadius: 10, padding: 14, alignItems: 'center' },
  joinBtnText: { color: Colors.white, fontWeight: '900', fontSize: 16, letterSpacing: 2 },

  // Waiting room
  waitingBox: {
    backgroundColor: Colors.offWhite + '08', borderRadius: 16, borderWidth: 1,
    borderColor: Colors.gold + '30', padding: 40, alignItems: 'center', gap: 12, maxWidth: 400,
  },
  waitingLabel: { color: Colors.gold, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  waitingCode: { color: Colors.white, fontSize: 52, fontWeight: '900', letterSpacing: 10 },
  waitingHint: { color: Colors.textLight, fontSize: 13, textAlign: 'center' },
  waitingDots: { marginTop: 8 },
  waitingDotsText: { color: Colors.mcOrange, fontSize: 14 },

  // Ranking / cards
  rankingFullBtn: { backgroundColor: Colors.gold + '15', borderWidth: 1, borderColor: Colors.gold + '40', borderRadius: 10, padding: 16, alignSelf: 'flex-start' },
  rankingFullBtnText: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
});
