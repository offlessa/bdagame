import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useSocket, getSocket } from '../hooks/useSocket';
import { Colors } from '../theme/colors';

export default function LobbyScreen() {
  const { username, logout } = useAuthStore();
  const { roomId, phase } = useGameStore();
  const [joinCode, setJoinCode] = useState('');
  useSocket();

  useEffect(() => {
    if (phase === 'draft') router.replace('/draft');
  }, [phase]);

  function createRoom() {
    getSocket()?.emit('room:create');
  }

  function joinRoom() {
    if (!joinCode.trim()) { Alert.alert('Digite o código da sala'); return; }
    getSocket()?.emit('room:join', { roomId: joinCode.trim().toUpperCase() });
  }

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  return (
    <LinearGradient colors={[Colors.bg, '#3D1500']} style={styles.bg}>
      <View style={styles.container}>
        <Text style={styles.greeting}>Bem-vindo, {username}!</Text>
        <Text style={styles.title}>BATALHA{'\n'}DA ALDEIA</Text>

        {roomId && phase === 'lobby' && (
          <View style={styles.roomBox}>
            <Text style={styles.roomLabel}>Código da sua sala:</Text>
            <Text style={styles.roomCode}>{roomId}</Text>
            <Text style={styles.roomWait}>Aguardando oponente...</Text>
          </View>
        )}

        {!roomId && (
          <>
            <TouchableOpacity style={styles.btnPrimary} onPress={createRoom}>
              <Text style={styles.btnText}>CRIAR SALA</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>— ou —</Text>

            <TextInput
              style={styles.input}
              placeholder="Código da sala"
              placeholderTextColor={Colors.textLight}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity style={styles.btnSecondary} onPress={joinRoom}>
              <Text style={styles.btnText}>ENTRAR NA SALA</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => router.push('/ranking')} style={styles.rankingBtn}>
          <Text style={styles.rankingText}>Ver Ranking</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  greeting: { color: Colors.gold, fontSize: 14, marginBottom: 8 },
  title: { fontSize: 36, fontWeight: '900', color: Colors.mcOrange, textAlign: 'center', letterSpacing: 2, marginBottom: 40, lineHeight: 42 },
  roomBox: { backgroundColor: Colors.offWhite + '10', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: Colors.gold + '40' },
  roomLabel: { color: Colors.gold, fontSize: 12, marginBottom: 4 },
  roomCode: { color: Colors.white, fontSize: 40, fontWeight: '900', letterSpacing: 6 },
  roomWait: { color: Colors.textLight, fontSize: 12, marginTop: 8 },
  btnPrimary: { width: '100%', backgroundColor: Colors.mcOrange, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  btnSecondary: { width: '100%', backgroundColor: Colors.beatPurple, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: Colors.white, fontWeight: '900', fontSize: 16, letterSpacing: 2 },
  orText: { color: Colors.textLight, marginVertical: 12 },
  input: {
    width: '100%', backgroundColor: Colors.offWhite + '15', borderWidth: 1, borderColor: Colors.gold + '60',
    borderRadius: 10, color: Colors.white, padding: 14, fontSize: 20, textAlign: 'center', letterSpacing: 8,
  },
  rankingBtn: { marginTop: 30 },
  rankingText: { color: Colors.gold, fontSize: 14 },
  logoutBtn: { marginTop: 12 },
  logoutText: { color: Colors.textLight, fontSize: 13 },
});
