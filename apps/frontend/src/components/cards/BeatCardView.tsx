import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BeatCard } from '@batalha/game-engine';
import { Colors } from '../../theme/colors';

interface Props {
  beat: BeatCard;
  onPress?: () => void;
  faceDown?: boolean;
}

export function BeatCardView({ beat, onPress, faceDown }: Props) {
  if (faceDown) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.card}>
        <LinearGradient colors={[Colors.beatPurple, '#2A0E5E']} style={styles.faceDown}>
          <Text style={styles.faceDownText}>BEAT</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <LinearGradient colors={[Colors.offWhite, '#DDD0F0']} style={styles.inner}>
        <Text style={styles.name}>{beat.name.toUpperCase()}</Text>
        <Text style={styles.hype}>{'★'.repeat(beat.hype)}{'☆'.repeat(3 - beat.hype)}</Text>
        <Text style={styles.description}>{beat.description}</Text>
        <Text style={styles.effectTitle}>Efeito do Beat</Text>
        {beat.effects.map((e, i) => (
          <View key={i} style={styles.effectRow}>
            <Text style={[styles.effectAttr, { color: e.modifier > 0 ? Colors.success : Colors.danger }]}>
              {e.attribute.charAt(0).toUpperCase() + e.attribute.slice(1)} {e.modifier > 0 ? `+${e.modifier}` : e.modifier}
            </Text>
          </View>
        ))}
        {beat.effects.length === 0 && <Text style={styles.noEffect}>Sem modificadores</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: 160, borderRadius: 12, overflow: 'hidden', margin: 6, elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6 },
  faceDown: { height: 220, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  faceDownText: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  inner: { padding: 12 },
  name: { fontSize: 13, fontWeight: 'bold', color: Colors.text, letterSpacing: 1, marginBottom: 2 },
  hype: { color: Colors.gold, fontSize: 14, marginBottom: 4 },
  description: { fontSize: 10, color: Colors.textLight, marginBottom: 8, fontStyle: 'italic' },
  effectTitle: { fontSize: 11, fontWeight: '700', color: Colors.beatPurple, marginBottom: 4 },
  effectRow: { paddingVertical: 2 },
  effectAttr: { fontSize: 12, fontWeight: '600' },
  noEffect: { fontSize: 10, color: Colors.textLight },
});
