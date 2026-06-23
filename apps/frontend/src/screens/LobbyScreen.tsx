import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useSocket, getSocket } from '../hooks/useSocket';
import { Colors } from '../theme/colors';

export default function LobbyScreen() {
  const { username } = useAuthStore();
  const { roomId, phase } = useGameStore();
  const [joinCode, setJoinCode] = useState('');
  const [onlineMode, setOnlineMode] = useState(false);
  useSocket();

  useEffect(() => {
    if (phase === 'draft') router.replace('/battle');
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

  return (
    <View style={s.bg}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/menu')} style={s.back}>
          <Ionicons name="arrow-back" size={18} color={Colors.white} />
        </TouchableOpacity>
        <Text style={s.brand}>RAP<Text style={s.brandW}> BATTLE</Text></Text>
        <Text style={s.user}>{username}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {!onlineMode && (
          <>
            <Text style={s.title}>ESCOLHA O MODO</Text>
            <Text style={s.sub}>Como você quer batalhar hoje?</Text>

            <View style={s.grid}>
              {/* Solo */}
              <TouchableOpacity style={s.modeCard} onPress={() => router.push('/solo-battle')} activeOpacity={0.8}>
                <View style={[s.modeIcon, { backgroundColor: Colors.primary + '18' }]}>
                  <Text style={s.modeEmoji}>🎤</Text>
                </View>
                <Text style={[s.modeTitle, { color: Colors.primary }]}>SOLO</Text>
                <Text style={s.modeDesc}>Treina suas rimas contra a IA</Text>
                <View style={[s.playBtn, { backgroundColor: Colors.primary }]}>
                  <Text style={[s.playBtnTxt, { color: Colors.bg }]}>JOGAR</Text>
                </View>
              </TouchableOpacity>

              {/* Online */}
              <TouchableOpacity style={s.modeCard} onPress={() => setOnlineMode(true)} activeOpacity={0.8}>
                <View style={[s.modeIcon, { backgroundColor: Colors.orange + '18' }]}>
                  <Text style={s.modeEmoji}>🌐</Text>
                </View>
                <Text style={[s.modeTitle, { color: Colors.orange }]}>ONLINE</Text>
                <Text style={s.modeDesc}>Desafie outros MCs em tempo real</Text>
                <View style={[s.playBtn, { backgroundColor: Colors.orange }]}>
                  <Text style={[s.playBtnTxt, { color: Colors.white }]}>JOGAR</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}

        {onlineMode && (
          <>
            <TouchableOpacity onPress={() => { setOnlineMode(false); setJoinCode(''); }} style={s.backRow}>
              <Ionicons name="arrow-back" size={14} color={Colors.muted} />
              <Text style={s.backTxt}>Voltar</Text>
            </TouchableOpacity>

            <Text style={s.title}>MODO ONLINE</Text>
            <Text style={s.sub}>Crie uma sala ou entre em uma</Text>

            {roomId && phase === 'lobby' ? (
              <View style={s.waitBox}>
                <Text style={s.waitLabel}>CÓDIGO DA SALA</Text>
                <Text style={s.waitCode}>{roomId}</Text>
                <Text style={s.waitHint}>Compartilhe com seu oponente</Text>
                <Text style={s.waitDots}>Aguardando oponente...</Text>
              </View>
            ) : (
              <View style={s.onlineWrap}>
                <TouchableOpacity style={s.createBtn} onPress={createRoom} activeOpacity={0.8}>
                  <Text style={s.createIcon}>＋</Text>
                  <Text style={s.createTitle}>CRIAR SALA</Text>
                  <Text style={s.createSub}>Gere um código e convide alguém</Text>
                </TouchableOpacity>

                <View style={s.div}>
                  <View style={s.divLine} />
                  <Text style={s.divTxt}>ou</Text>
                  <View style={s.divLine} />
                </View>

                <View style={s.joinBox}>
                  <Text style={s.joinLabel}>ENTRAR EM UMA SALA</Text>
                  <TextInput
                    style={s.joinInput}
                    placeholder="CÓDIGO"
                    placeholderTextColor={Colors.muted}
                    value={joinCode}
                    onChangeText={setJoinCode}
                    autoCapitalize="characters"
                    maxLength={6}
                  />
                  <TouchableOpacity style={s.joinBtn} onPress={joinRoom} activeOpacity={0.85}>
                    <Text style={s.joinBtnTxt}>ENTRAR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
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
  back: { padding: 4 },
  brand: { fontSize: 16, fontWeight: '900', color: Colors.primary, letterSpacing: 2 },
  brandW: { color: Colors.white },
  user: { color: Colors.muted, fontSize: 12 },

  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48, alignItems: 'center' },

  title: { color: Colors.white, fontSize: 26, fontWeight: '900', letterSpacing: 4, textAlign: 'center' },
  sub: { color: Colors.muted, fontSize: 12, marginTop: 6, marginBottom: 28, textAlign: 'center' },

  grid: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 480 },
  modeCard: {
    flex: 1, minWidth: 180,
    backgroundColor: Colors.card, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: 24, alignItems: 'center', gap: 10,
  },
  modeIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  modeEmoji: { fontSize: 32 },
  modeTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  modeDesc: { color: Colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 16 },
  playBtn: { marginTop: 4, borderRadius: 3, paddingHorizontal: 24, paddingVertical: 8 },
  playBtnTxt: { fontWeight: '900', fontSize: 12, letterSpacing: 3 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 20 },
  backTxt: { color: Colors.muted, fontSize: 13 },

  onlineWrap: { width: '100%', maxWidth: 400 },
  createBtn: {
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.orange + '50',
    borderRadius: 6, padding: 24, alignItems: 'center', gap: 6,
  },
  createIcon: { fontSize: 28, color: Colors.orange },
  createTitle: { color: Colors.orange, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  createSub: { color: Colors.muted, fontSize: 12 },

  div: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divTxt: { color: Colors.muted, fontSize: 13 },

  joinBox: { gap: 10 },
  joinLabel: { color: Colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 3 },
  joinInput: {
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 4, color: Colors.white, padding: 14, fontSize: 22,
    textAlign: 'center', letterSpacing: 8,
  },
  joinBtn: { backgroundColor: Colors.purple, borderRadius: 4, padding: 14, alignItems: 'center' },
  joinBtnTxt: { color: Colors.white, fontWeight: '900', fontSize: 14, letterSpacing: 2 },

  waitBox: {
    backgroundColor: Colors.card, borderRadius: 6, borderWidth: 1.5,
    borderColor: Colors.primary + '40', padding: 36, alignItems: 'center', gap: 10, maxWidth: 360,
  },
  waitLabel: { color: Colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 3 },
  waitCode: { color: Colors.white, fontSize: 48, fontWeight: '900', letterSpacing: 10 },
  waitHint: { color: Colors.muted, fontSize: 12, textAlign: 'center' },
  waitDots: { color: Colors.orange, fontSize: 13, marginTop: 4 },
});
