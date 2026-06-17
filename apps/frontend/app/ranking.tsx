import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../src/theme/colors';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface RankEntry { user_id: string; username: string; wins: number; losses: number; win_rate: number }

export default function RankingScreen() {
  const [ranking, setRanking] = useState<RankEntry[]>([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/ranking`)
      .then((r) => r.json())
      .then((d) => setRanking(d as RankEntry[]))
      .catch(() => {});
  }, []);

  return (
    <LinearGradient colors={[Colors.bg, '#3D1500']} style={styles.bg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
        <Text style={styles.title}>RANKING</Text>
      </View>
      <FlatList
        data={ranking}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={[styles.pos, index < 3 && styles.posTop]}>{index + 1}°</Text>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.wins}>{item.wins}W</Text>
            <Text style={styles.rate}>{(item.win_rate * 100).toFixed(0)}%</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12 },
  back: { marginBottom: 8 },
  backText: { color: Colors.gold, fontSize: 14 },
  title: { color: Colors.mcOrange, fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  list: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.offWhite + '10', borderRadius: 10, padding: 14, marginBottom: 8 },
  pos: { width: 36, color: Colors.textLight, fontWeight: '700', fontSize: 16 },
  posTop: { color: Colors.gold },
  username: { flex: 1, color: Colors.white, fontSize: 15, fontWeight: '600' },
  wins: { color: Colors.success, fontWeight: '700', marginRight: 12 },
  rate: { color: Colors.gold, fontWeight: '700', width: 48, textAlign: 'right' },
});
