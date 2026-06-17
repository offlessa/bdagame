import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../theme/colors';

export default function ResultScreen() {
  const { battle, reset } = useGameStore();
  const userId = useAuthStore((s) => s.userId);

  const won = battle?.winner === userId;

  function goHome() {
    reset();
    router.replace('/lobby');
  }

  return (
    <LinearGradient
      colors={won ? [Colors.bg, '#0E3D1A'] : [Colors.bg, '#3D0E0E']}
      style={styles.bg}
    >
      <View style={styles.container}>
        <Text style={styles.emoji}>{won ? '🏆' : '💀'}</Text>
        <Text style={[styles.result, won ? styles.win : styles.lose]}>
          {won ? 'VITÓRIA!' : 'DERROTA'}
        </Text>
        <Text style={styles.sub}>
          {won ? 'Você dominou a aldeia!' : 'A próxima batalha é sua.'}
        </Text>

        <View style={styles.scoreboard}>
          {battle?.players.map((p) => (
            <View key={p.id} style={styles.scoreRow}>
              <Text style={styles.scorePlayer}>{p.id === userId ? 'Você' : 'Oponente'}</Text>
              <Text style={styles.scoreValue}>{p.roundsWon} rounds</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={goHome}>
          <Text style={styles.btnText}>VOLTAR AO LOBBY</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 80, marginBottom: 16 },
  result: { fontSize: 48, fontWeight: '900', letterSpacing: 4 },
  win: { color: Colors.gold },
  lose: { color: Colors.danger },
  sub: { color: Colors.offWhite, fontSize: 16, marginTop: 8, marginBottom: 32 },
  scoreboard: { backgroundColor: Colors.offWhite + '10', borderRadius: 12, padding: 20, width: '100%', marginBottom: 32 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  scorePlayer: { color: Colors.white, fontSize: 16 },
  scoreValue: { color: Colors.gold, fontSize: 16, fontWeight: '700' },
  btn: { backgroundColor: Colors.mcOrange, borderRadius: 12, padding: 18, width: '100%', alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '900', fontSize: 18, letterSpacing: 2 },
});
