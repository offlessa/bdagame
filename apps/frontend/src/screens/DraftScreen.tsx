import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../hooks/useSocket';
import { MCCardView } from '../components/cards/MCCardView';
import { Colors } from '../theme/colors';

export default function DraftScreen() {
  const { availableMCs, selectedMCIds, toggleSelectMC, roomId } = useGameStore();

  function confirm() {
    if (selectedMCIds.length !== 3) { Alert.alert('Selecione exatamente 3 MCs'); return; }
    getSocket()?.emit('draft:ready', { roomId, mcIds: selectedMCIds });
    router.replace('/battle');
  }

  return (
    <LinearGradient colors={[Colors.bg, '#3D1500']} style={styles.bg}>
      <View style={styles.header}>
        <Text style={styles.title}>ESCOLHA SEU TIME</Text>
        <Text style={styles.sub}>{selectedMCIds.length}/3 MCs · A ordem importa! (esq → dir)</Text>
      </View>

      {selectedMCIds.length > 0 && (
        <View style={styles.selectedBar}>
          <Text style={styles.selectedLabel}>Selecionados:</Text>
          <View style={styles.selectedList}>
            {selectedMCIds.map((id, i) => {
              const mc = availableMCs.find((m) => m.id === id);
              return (
                <TouchableOpacity key={id} onPress={() => toggleSelectMC(id)} style={styles.selectedChip}>
                  <Text style={styles.selectedChipText}>{i + 1}. {mc?.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.grid}>
        {availableMCs.map((mc) => (
          <MCCardView
            key={mc.id}
            mc={mc}
            selected={selectedMCIds.includes(mc.id)}
            onPress={() => toggleSelectMC(mc.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, selectedMCIds.length !== 3 && styles.confirmBtnDisabled]}
          onPress={confirm}
          disabled={selectedMCIds.length !== 3}
        >
          <Text style={styles.confirmText}>CONFIRMAR TIME</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: { padding: 16, paddingTop: 50, alignItems: 'center' },
  title: { color: Colors.mcOrange, fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  sub: { color: Colors.gold, fontSize: 12, marginTop: 4 },
  selectedBar: { backgroundColor: Colors.offWhite + '10', padding: 12, marginHorizontal: 12, borderRadius: 10 },
  selectedLabel: { color: Colors.gold, fontSize: 11, marginBottom: 4 },
  selectedList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectedChip: { backgroundColor: Colors.mcOrange + '30', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  selectedChipText: { color: Colors.white, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 8 },
  footer: { padding: 16 },
  confirmBtn: { backgroundColor: Colors.mcOrange, borderRadius: 12, padding: 16, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmText: { color: Colors.white, fontWeight: '900', fontSize: 18, letterSpacing: 2 },
});
